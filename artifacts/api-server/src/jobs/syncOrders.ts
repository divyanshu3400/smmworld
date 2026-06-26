/**
 * Background job: sync active order statuses from WorldOfSMM every 3 minutes.
 *
 * Flow per order:
 *  1. Fetch status from provider
 *  2. Update order row in Supabase
 *  3. On `partial`  → refund the unfulfilled portion + send notification
 *  4. On `cancelled`→ full refund (if not already refunded) + send notification
 *  5. On `completed`→ send success notification
 *  6. Terminal statuses (completed/partial/cancelled) → set completed_at
 */

import { supabaseAdmin } from "../lib/supabaseAdmin";
import { fetchOrderStatus } from "../services/smmService";
import { logger } from "../lib/logger";

const SYNC_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes
const BATCH_SIZE = 10;                   // orders per batch
const BATCH_DELAY_MS = 600;             // pause between batches (ms)

const ACTIVE_STATUSES = ["pending", "processing", "in_progress"];
const TERMINAL_STATUSES = ["completed", "partial", "cancelled", "refunded"];

let isRunning = false;
let intervalHandle: ReturnType<typeof setInterval> | null = null;

// ── helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

type OrderRow = {
  id: string;
  user_id: string;
  external_order_id: string;
  status: string;
  price_usd: number;
  quantity: number;
  service_name: string;
};

type NotificationType = "info" | "warning" | "success" | "error";

async function sendNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  actionUrl?: string
) {
  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    action_url: actionUrl ?? null,
  });
  if (error) {
    logger.warn({ error, userId }, "Failed to insert notification");
  }
}

/** Issue a partial refund for the unfulfilled portion of an order. */
async function issuePartialRefund(order: OrderRow, remainsStr: string) {
  const remains = parseInt(remainsStr, 10);
  if (isNaN(remains) || remains <= 0) return;

  const refundFraction = remains / order.quantity;
  const refundUSD = order.price_usd * refundFraction;
  if (refundUSD < 0.0001) return;

  const { data: wallet } = await supabaseAdmin
    .from("wallets")
    .select("id, balance")
    .eq("user_id", order.user_id)
    .single();

  if (!wallet) return;

  const newBalance = wallet.balance + refundUSD;

  await supabaseAdmin
    .from("wallets")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("id", wallet.id);

  await supabaseAdmin.from("wallet_transactions").insert({
    wallet_id: wallet.id,
    user_id: order.user_id,
    type: "refund",
    amount: refundUSD,
    description: `Partial refund: ${remains} unfulfilled units`,
    reference_id: order.id,
    balance_after: newBalance,
  });

  logger.info(
    { orderId: order.id, remains, refundUSD: refundUSD.toFixed(6) },
    "Partial refund issued"
  );
}

/** Issue a full refund for a cancelled order (skip if already refunded). */
async function issueFullRefund(order: OrderRow) {
  if (!order.price_usd || order.price_usd <= 0) return;

  const { data: existing } = await supabaseAdmin
    .from("wallet_transactions")
    .select("id")
    .eq("reference_id", order.id)
    .eq("type", "refund")
    .limit(1);

  if (existing && existing.length > 0) {
    logger.debug({ orderId: order.id }, "Full refund already issued, skipping");
    return;
  }

  const { data: wallet } = await supabaseAdmin
    .from("wallets")
    .select("id, balance")
    .eq("user_id", order.user_id)
    .single();

  if (!wallet) return;

  const newBalance = wallet.balance + order.price_usd;

  await supabaseAdmin
    .from("wallets")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("id", wallet.id);

  await supabaseAdmin.from("wallet_transactions").insert({
    wallet_id: wallet.id,
    user_id: order.user_id,
    type: "refund",
    amount: order.price_usd,
    description: `Auto-refund: order cancelled by provider`,
    reference_id: order.id,
    balance_after: newBalance,
  });

  logger.info({ orderId: order.id, refundUSD: order.price_usd }, "Full refund issued");
}

/** Sync a single order against the provider. */
async function syncOrder(order: OrderRow): Promise<"updated" | "unchanged" | "error"> {
  try {
    const status = await fetchOrderStatus(order.external_order_id);
    const providerStatus = status.status?.toLowerCase() ?? "";

    const statusMap: Record<string, string> = {
      pending: "pending",
      processing: "processing",
      "in progress": "in_progress",
      inprogress: "in_progress",
      completed: "completed",
      partial: "partial",
      cancelled: "cancelled",
      canceled: "cancelled",
    };
    const newStatus = statusMap[providerStatus] ?? providerStatus;

    if (newStatus === order.status) return "unchanged";

    const isTerminal = TERMINAL_STATUSES.includes(newStatus);
    const now = new Date().toISOString();

    const updates: Record<string, unknown> = {
      status: newStatus,
      updated_at: now,
    };
    if (status.start_count) updates.start_count = parseInt(status.start_count);
    if (status.remains) updates.remains = parseInt(status.remains);
    if (status.charge) updates.charge = parseFloat(status.charge);
    if (isTerminal) updates.completed_at = now;

    await supabaseAdmin.from("orders").update(updates).eq("id", order.id);

    const orderUrl = `/orders`;

    if (newStatus === "completed") {
      await sendNotification(
        order.user_id,
        "Order Completed ✓",
        `Your order for "${order.service_name}" has been completed successfully.`,
        "success",
        orderUrl
      );
    } else if (newStatus === "partial" && status.remains) {
      await issuePartialRefund(order, status.remains);
      const remains = parseInt(status.remains, 10);
      const fulfilled = order.quantity - remains;
      await sendNotification(
        order.user_id,
        "Order Partially Completed",
        `Your order for "${order.service_name}" was partially fulfilled (${fulfilled}/${order.quantity} units). The unfulfilled portion has been refunded.`,
        "warning",
        orderUrl
      );
    } else if (newStatus === "cancelled") {
      await issueFullRefund(order);
      await sendNotification(
        order.user_id,
        "Order Cancelled",
        `Your order for "${order.service_name}" was cancelled by the provider. Your full payment has been refunded.`,
        "error",
        orderUrl
      );
    } else if (newStatus === "in_progress" && order.status !== "in_progress") {
      await sendNotification(
        order.user_id,
        "Order In Progress",
        `Your order for "${order.service_name}" is now being processed.`,
        "info",
        orderUrl
      );
    }

    logger.info(
      { orderId: order.id, from: order.status, to: newStatus },
      "Order status updated"
    );
    return "updated";
  } catch (err) {
    logger.warn(
      { orderId: order.id, err: err instanceof Error ? err.message : err },
      "Failed to sync order status"
    );
    return "error";
  }
}

// ── main job ──────────────────────────────────────────────────────────────────

async function runSyncJob() {
  if (isRunning) {
    logger.debug("Sync job already running, skipping this tick");
    return;
  }

  isRunning = true;
  const startedAt = Date.now();
  const stats = { total: 0, updated: 0, unchanged: 0, errors: 0 };

  try {
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, external_order_id, status, price_usd, quantity, service_name")
      .in("status", ACTIVE_STATUSES)
      .not("external_order_id", "is", null)
      .order("updated_at", { ascending: true })
      .limit(200);

    if (error) {
      logger.error({ error }, "Sync job: failed to fetch active orders");
      return;
    }

    if (!orders || orders.length === 0) {
      logger.debug("Sync job: no active orders to sync");
      return;
    }

    stats.total = orders.length;
    logger.info({ count: orders.length }, "Sync job: starting order sync");

    for (let i = 0; i < orders.length; i += BATCH_SIZE) {
      const batch = orders.slice(i, i + BATCH_SIZE) as OrderRow[];

      const results = await Promise.all(batch.map(syncOrder));
      results.forEach((r) => {
        if (r === "updated") stats.updated++;
        else if (r === "unchanged") stats.unchanged++;
        else stats.errors++;
      });

      if (i + BATCH_SIZE < orders.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    const elapsed = Date.now() - startedAt;
    logger.info({ ...stats, elapsedMs: elapsed }, "Sync job: completed");
  } catch (err) {
    logger.error({ err }, "Sync job: unexpected error");
  } finally {
    isRunning = false;
  }
}

// ── lifecycle ─────────────────────────────────────────────────────────────────

export function startSyncJob() {
  if (intervalHandle) return;

  logger.info({ intervalMs: SYNC_INTERVAL_MS }, "Order sync job started");

  setTimeout(runSyncJob, 10_000);
  intervalHandle = setInterval(runSyncJob, SYNC_INTERVAL_MS);
}

export function stopSyncJob() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    logger.info("Order sync job stopped");
  }
}
