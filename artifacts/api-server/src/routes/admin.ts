import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { requireAdmin } from "../lib/adminAuth";
import { checkIsAdmin } from "../lib/adminAuth";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { logger } from "../lib/logger";
import {
  fetchBalance,
  fetchOrderStatus,
  cancelProviderOrder,
} from "../services/smmService";

const router = Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(limiter);

// ── GET /api/admin/check ─────────────────────────────────────────────────────
router.get("/check", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.json({ isAdmin: false });
    return;
  }
  const token = authHeader.slice(7);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    res.json({ isAdmin: false });
    return;
  }
  const isAdmin = await checkIsAdmin(data.user.id);
  res.json({ isAdmin });
});

// ── GET /api/admin/overview ──────────────────────────────────────────────────
router.get("/overview", requireAdmin, async (req, res) => {
  try {
    const [
      providerBalanceResult,
      totalRevenueResult,
      orderCountsResult,
      userListResult,
      ordersTodayResult,
      recentOrdersResult,
      revenueDaysResult,
    ] = await Promise.allSettled([
      fetchBalance(),
      supabaseAdmin
        .from("wallet_transactions")
        .select("amount")
        .eq("type", "purchase"),
      supabaseAdmin
        .from("orders")
        .select("status", { count: "exact", head: false }),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 }),
      supabaseAdmin
        .from("orders")
        .select("id", { count: "exact" })
        .gte("created_at", new Date().toISOString().slice(0, 10)),
      supabaseAdmin
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10),
      supabaseAdmin
        .from("wallet_transactions")
        .select("amount, created_at")
        .eq("type", "purchase")
        .gte(
          "created_at",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        )
        .order("created_at", { ascending: true }),
    ]);

    const providerBalance =
      providerBalanceResult.status === "fulfilled"
        ? providerBalanceResult.value
        : { balance: "N/A", currency: "USD" };

    const transactions =
      totalRevenueResult.status === "fulfilled"
        ? (totalRevenueResult.value.data as { amount: number }[] | null) || []
        : [];
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    const orders =
      orderCountsResult.status === "fulfilled"
        ? (orderCountsResult.value.data as { status: string }[] | null) || []
        : [];

    const ordersByStatus: Record<string, number> = {};
    orders.forEach((o) => {
      ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
    });
    const totalOrders = orders.length;
    const activeOrders =
      (ordersByStatus["pending"] || 0) +
      (ordersByStatus["processing"] || 0) +
      (ordersByStatus["in_progress"] || 0);

    const totalUsers =
      userListResult.status === "fulfilled"
        ? (userListResult.value.data as { total?: number } | undefined)?.total || 0
        : 0;

    const ordersToday =
      ordersTodayResult.status === "fulfilled"
        ? ordersTodayResult.value.count || 0
        : 0;

    const recentOrders =
      recentOrdersResult.status === "fulfilled"
        ? recentOrdersResult.value.data || []
        : [];

    // Build revenue by day (last 30 days)
    const revenueTxns =
      revenueDaysResult.status === "fulfilled"
        ? (revenueDaysResult.value.data as { amount: number; created_at: string }[] | null) || []
        : [];

    const revenueByDay: Record<string, number> = {};
    revenueTxns.forEach((t) => {
      const day = t.created_at.slice(0, 10);
      revenueByDay[day] = (revenueByDay[day] || 0) + t.amount;
    });
    const revenueChart = Object.entries(revenueByDay)
      .map(([date, revenue]) => ({ date, revenue: parseFloat(revenue.toFixed(4)) }))
      .slice(-30);

    res.json({
      providerBalance,
      totalRevenue: parseFloat(totalRevenue.toFixed(4)),
      totalOrders,
      activeOrders,
      totalUsers,
      ordersToday,
      ordersByStatus,
      revenueChart,
      recentOrders,
    });
  } catch (err) {
    logger.error({ err }, "Admin overview failed");
    res.status(500).json({ error: "Failed to load overview" });
  }
});

// ── GET /api/admin/orders ────────────────────────────────────────────────────
router.get("/orders", requireAdmin, async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page || "1")));
  const limit = Math.min(100, parseInt(String(req.query.limit || "20")));
  const status = String(req.query.status || "");
  const search = String(req.query.search || "").trim();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from("orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  if (search) {
    query = query.or(
      `service_name.ilike.%${search}%,external_order_id.ilike.%${search}%`
    );
  }

  const { data: orders, error, count } = await query.range(from, to);

  if (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
    return;
  }

  // Enrich with user profile data
  const userIds = [...new Set((orders || []).map((o: { user_id: string }) => o.user_id))];
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", userIds);

  const profileMap: Record<string, { first_name: string | null; last_name: string | null }> = {};
  (profiles || []).forEach((p: { id: string; first_name: string | null; last_name: string | null }) => {
    profileMap[p.id] = { first_name: p.first_name, last_name: p.last_name };
  });

  const enriched = (orders || []).map((o: Record<string, unknown>) => ({
    ...o,
    user_name:
      [profileMap[o.user_id as string]?.first_name, profileMap[o.user_id as string]?.last_name]
        .filter(Boolean)
        .join(" ") || "Unknown",
  }));

  res.json({ orders: enriched, total: count || 0, page, limit });
});

// ── POST /api/admin/orders/:id/sync ─────────────────────────────────────────
router.post("/orders/:id/sync", requireAdmin, async (req, res) => {
  const { id } = req.params;

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (!order.external_order_id) {
    res.status(400).json({ error: "No external order ID" });
    return;
  }

  try {
    const status = await fetchOrderStatus(order.external_order_id);
    const updates: Record<string, unknown> = {
      status: status.status,
      updated_at: new Date().toISOString(),
    };
    if (status.start_count) updates.start_count = parseInt(status.start_count);
    if (status.remains) updates.remains = parseInt(status.remains);
    if (status.charge) updates.charge = parseFloat(status.charge);
    if (["completed", "partial", "cancelled"].includes(status.status)) {
      updates.completed_at = new Date().toISOString();
    }
    await supabaseAdmin.from("orders").update(updates).eq("id", id);
    res.json({ success: true, status: status.status });
  } catch (err) {
    logger.error({ err, id }, "Admin order sync failed");
    res.status(502).json({ error: "Provider sync failed" });
  }
});

// ── POST /api/admin/orders/:id/cancel ────────────────────────────────────────
router.post("/orders/:id/cancel", requireAdmin, async (req, res) => {
  const { id } = req.params;

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // Guard: already in a terminal state — nothing to do
  if (["cancelled", "refunded", "completed", "partial"].includes(order.status)) {
    res.status(400).json({ error: `Order is already ${order.status} and cannot be cancelled` });
    return;
  }

  if (order.external_order_id) {
    await cancelProviderOrder(order.external_order_id);
  }

  await supabaseAdmin
    .from("orders")
    .update({
      status: "cancelled",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  // Refund — idempotency guard: skip if a refund tx already exists for this order
  if (order.price_usd) {
    const { data: existingRefund } = await supabaseAdmin
      .from("wallet_transactions")
      .select("id")
      .eq("reference_id", id)
      .eq("type", "refund")
      .limit(1);

    if (!existingRefund || existingRefund.length === 0) {
      const { data: wallet } = await supabaseAdmin
        .from("wallets")
        .select("id, balance")
        .eq("user_id", order.user_id)
        .single();
      if (wallet) {
        const newBal = wallet.balance + order.price_usd;
        await supabaseAdmin
          .from("wallets")
          .update({ balance: newBal, updated_at: new Date().toISOString() })
          .eq("id", wallet.id);
        await supabaseAdmin.from("wallet_transactions").insert({
          wallet_id: wallet.id,
          user_id: order.user_id,
          type: "refund",
          amount: order.price_usd,
          description: "Admin cancelled order refund",
          reference_id: id,
          balance_after: newBal,
        });
      }
    } else {
      logger.info({ orderId: id }, "Admin cancel: refund already exists, skipping");
    }
  }

  res.json({ success: true });
});

// ── GET /api/admin/users ─────────────────────────────────────────────────────
router.get("/users", requireAdmin, async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page || "1")));
  const perPage = Math.min(50, parseInt(String(req.query.limit || "20")));
  const search = String(req.query.search || "").trim().toLowerCase();

  const { data: authData, error } = await supabaseAdmin.auth.admin.listUsers({
    page,
    perPage,
  });

  if (error) {
    res.status(500).json({ error: "Failed to fetch users" });
    return;
  }

  let users = authData.users;
  if (search) {
    users = users.filter(
      (u) =>
        u.email?.toLowerCase().includes(search) ||
        u.id.includes(search)
    );
  }

  const userIds = users.map((u) => u.id);

  const [walletsResult, profilesResult, orderCountsResult] = await Promise.allSettled([
    supabaseAdmin.from("wallets").select("user_id, balance, currency").in("user_id", userIds),
    supabaseAdmin.from("profiles").select("id, first_name, last_name").in("id", userIds),
    supabaseAdmin.from("orders").select("user_id", { count: "exact", head: false }).in("user_id", userIds),
  ]);

  const walletMap: Record<string, { balance: number; currency: string }> = {};
  if (walletsResult.status === "fulfilled") {
    (walletsResult.value.data || []).forEach((w: { user_id: string; balance: number; currency: string }) => {
      walletMap[w.user_id] = { balance: w.balance, currency: w.currency };
    });
  }

  const profileMap: Record<string, { first_name: string | null; last_name: string | null }> = {};
  if (profilesResult.status === "fulfilled") {
    (profilesResult.value.data || []).forEach((p: { id: string; first_name: string | null; last_name: string | null }) => {
      profileMap[p.id] = { first_name: p.first_name, last_name: p.last_name };
    });
  }

  const orderCountMap: Record<string, number> = {};
  if (orderCountsResult.status === "fulfilled") {
    (orderCountsResult.value.data || []).forEach((o: { user_id: string }) => {
      orderCountMap[o.user_id] = (orderCountMap[o.user_id] || 0) + 1;
    });
  }

  const enriched = users.map((u) => ({
    id: u.id,
    email: u.email || "",
    first_name: profileMap[u.id]?.first_name || null,
    last_name: profileMap[u.id]?.last_name || null,
    balance: walletMap[u.id]?.balance || 0,
    currency: walletMap[u.id]?.currency || "USD",
    total_orders: orderCountMap[u.id] || 0,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    is_confirmed: !!u.confirmed_at,
  }));

  res.json({ users: enriched, total: authData.total || users.length, page });
});

// ── POST /api/admin/users/:id/wallet/adjust ───────────────────────────────────
const WalletAdjustSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["credit", "debit"]),
  description: z.string().min(1).max(200),
});

router.post("/users/:id/wallet/adjust", requireAdmin, async (req, res) => {
  const { id } = req.params;

  const parsed = WalletAdjustSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const { amount, type, description } = parsed.data;

  const { data: wallet, error } = await supabaseAdmin
    .from("wallets")
    .select("id, balance, currency")
    .eq("user_id", id)
    .single();

  let currentWallet: { id: string; balance: number; currency: string };
  if (error || !wallet) {
    const { data: newWallet, error: createErr } = await supabaseAdmin
      .from("wallets")
      .insert({ user_id: id, balance: 0, currency: "USD" })
      .select()
      .single();

    if (createErr || !newWallet) {
      res.status(404).json({ error: "Wallet not found and could not be created" });
      return;
    }
    currentWallet = newWallet;
  } else {
    currentWallet = wallet;
  }
  const newBalance =
    type === "credit"
      ? currentWallet.balance + amount
      : currentWallet.balance - amount;

  if (newBalance < 0) {
    res.status(400).json({ error: "Insufficient balance for deduction" });
    return;
  }

  const { error: updateErr } = await supabaseAdmin
    .from("wallets")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("user_id", id);

  if (updateErr) {
    res.status(500).json({ error: "Failed to update wallet" });
    return;
  }

  await supabaseAdmin.from("wallet_transactions").insert({
    wallet_id: currentWallet.id,
    user_id: id,
    type,
    amount,
    description: `[Admin] ${description}`,
    balance_after: newBalance,
  });

  logger.info({ userId: id, type, amount, adminId: req.userId }, "Admin wallet adjustment");
  res.json({ success: true, newBalance });
});

export default router;
