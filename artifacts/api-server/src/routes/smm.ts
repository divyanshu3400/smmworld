import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { requireAuth } from "../lib/auth";
import { requireAdmin } from "../lib/adminAuth";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { logger } from "../lib/logger";
import {
  fetchServices,
  fetchBalance,
  submitOrder,
  fetchOrderStatus,
  cancelProviderOrder,
} from "../services/smmService";

const router = Router();

const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many order requests, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// ── GET /api/smm/services ────────────────────────────────────────────────────
// Public — no auth required (services catalog is public)
router.get("/services", generalLimiter, async (req, res) => {
  try {
    const services = await fetchServices();
    res.json({ services });
  } catch (err) {
    logger.error({ err }, "Failed to fetch SMM services");
    res.status(502).json({ error: "Failed to fetch services from provider" });
  }
});

// ── GET /api/smm/balance ─────────────────────────────────────────────────────
// Admin-only provider balance (not user wallet)
router.get("/balance", requireAdmin, generalLimiter, async (req, res) => {
  try {
    const balance = await fetchBalance();
    res.json(balance);
  } catch (err) {
    logger.error({ err }, "Failed to fetch provider balance");
    res.status(502).json({ error: "Failed to fetch provider balance" });
  }
});

// ── POST /api/smm/order ──────────────────────────────────────────────────────
const CreateOrderSchema = z.object({
  serviceId: z.number().int().positive(),
  serviceName: z.string().min(1).max(500),
  platform: z.string().min(1).max(100),
  link: z.string().url("Invalid URL"),
  quantity: z.number().int().positive(),
  priceUsd: z.number().positive(),
});

router.post("/order", requireAuth, orderLimiter, async (req, res) => {
  const userId = req.userId!;

  const parsed = CreateOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const { serviceId, serviceName, platform, link, quantity, priceUsd } = parsed.data;

  // 1. Get user wallet
  const { data: wallet, error: walletErr } = await supabaseAdmin
    .from("wallets")
    .select("id, balance, currency")
    .eq("user_id", userId)
    .single();

  if (walletErr || !wallet) {
    res.status(400).json({ error: "Wallet not found" });
    return;
  }

  // 2. Check balance (compare in USD)
  if (wallet.balance < priceUsd) {
    res.status(400).json({ error: "Insufficient wallet balance" });
    return;
  }

  // 3. Deduct balance atomically (optimistic — before provider call)
  // Use .select() so we can detect 0-row updates (balance changed under us).
  const newBalance = wallet.balance - priceUsd;
  const { data: deducted, error: deductErr } = await supabaseAdmin
    .from("wallets")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("id", wallet.id)
    .eq("balance", wallet.balance) // optimistic concurrency: only update if balance unchanged
    .select("id");

  if (deductErr || !deducted || deducted.length === 0) {
    res.status(409).json({ error: "Balance update conflict, please retry" });
    return;
  }

  // 4. Create local order record (pending)
  const { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .insert({
      user_id: userId,
      service_id: String(serviceId),
      service_name: serviceName,
      platform,
      link,
      quantity,
      price: priceUsd,
      currency: "USD",
      price_usd: priceUsd,
      status: "pending",
    })
    .select()
    .single();

  if (orderErr || !order) {
    // Rollback balance
    await supabaseAdmin
      .from("wallets")
      .update({ balance: wallet.balance, updated_at: new Date().toISOString() })
      .eq("id", wallet.id);
    logger.error({ orderErr }, "Failed to create local order record");
    res.status(500).json({ error: "Failed to create order record" });
    return;
  }

  // 5. Record debit transaction
  await supabaseAdmin.from("wallet_transactions").insert({
    wallet_id: wallet.id,
    user_id: userId,
    type: "purchase",
    amount: priceUsd,
    description: `Order: ${serviceName}`,
    reference_id: order.id,
    balance_after: newBalance,
  });

  // 6. Submit to WorldOfSMM
  let externalOrderId: string | null = null;
  try {
    const providerOrder = await submitOrder({ service: serviceId, link, quantity });
    externalOrderId = String(providerOrder.order);

    // 7. Update order with provider ID and processing status
    await supabaseAdmin
      .from("orders")
      .update({
        external_order_id: externalOrderId,
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    logger.info({ orderId: order.id, externalOrderId }, "Order submitted successfully");
    res.status(201).json({ success: true, orderId: order.id, externalOrderId });
  } catch (err) {
    // 8. Provider failed — refund user
    const refundBalance = newBalance + priceUsd;
    await supabaseAdmin
      .from("wallets")
      .update({ balance: refundBalance, updated_at: new Date().toISOString() })
      .eq("id", wallet.id);

    await supabaseAdmin.from("wallet_transactions").insert({
      wallet_id: wallet.id,
      user_id: userId,
      type: "refund",
      amount: priceUsd,
      description: `Refund: provider rejected order`,
      reference_id: order.id,
      balance_after: refundBalance,
    });

    await supabaseAdmin
      .from("orders")
      .update({
        status: "cancelled",
        error_message: err instanceof Error ? err.message : "Provider error",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    logger.error({ err, orderId: order.id }, "Provider order submission failed, refunded");
    res.status(502).json({ error: "Provider rejected order. Your balance has been refunded." });
  }
});

// ── GET /api/smm/order/:id ───────────────────────────────────────────────────
router.get("/order/:id", requireAuth, generalLimiter, async (req, res) => {
  const userId = req.userId!;
  const orderId = req.params.id;

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", userId)
    .single();

  if (error || !order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // Sync status from provider if active
  if (order.external_order_id && !["completed", "cancelled", "refunded"].includes(order.status)) {
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

      await supabaseAdmin.from("orders").update(updates).eq("id", orderId);
      res.json({ ...order, ...updates });
      return;
    } catch (err) {
      logger.warn({ err, orderId }, "Failed to sync order status from provider");
    }
  }

  res.json(order);
});

// ── POST /api/smm/cancel ─────────────────────────────────────────────────────
const CancelSchema = z.object({ orderId: z.string().uuid() });

router.post("/cancel", requireAuth, orderLimiter, async (req, res) => {
  const userId = req.userId!;

  const parsed = CancelSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid orderId" });
    return;
  }

  const { orderId } = parsed.data;

  const { data: order, error: fetchErr } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", userId)
    .single();

  if (fetchErr || !order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (["completed", "cancelled", "refunded"].includes(order.status)) {
    res.status(400).json({ error: "Order cannot be cancelled" });
    return;
  }

  // Attempt provider cancellation
  if (order.external_order_id) {
    await cancelProviderOrder(order.external_order_id);
  }

  // Update local status
  await supabaseAdmin
    .from("orders")
    .update({
      status: "cancelled",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  // Refund wallet
  if (order.price_usd) {
    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("id, balance")
      .eq("user_id", userId)
      .single();

    if (wallet) {
      const refundBalance = wallet.balance + order.price_usd;
      await supabaseAdmin
        .from("wallets")
        .update({ balance: refundBalance, updated_at: new Date().toISOString() })
        .eq("id", wallet.id);

      await supabaseAdmin.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        user_id: userId,
        type: "refund",
        amount: order.price_usd,
        description: `Refund for cancelled order`,
        reference_id: orderId,
        balance_after: refundBalance,
      });
    }
  }

  logger.info({ orderId, userId }, "Order cancelled and refunded");
  res.json({ success: true });
});

export default router;
