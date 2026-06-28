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
  getServiceSellRate,
} from "../services/smmService";
import { calculatePricing } from "../lib/pricing";

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
router.get("/services", generalLimiter, async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = supabaseAdmin
      .from("smm_services_cache")
      .select("*")
      .order("name", { ascending: true });

    if (category && typeof category === "string") {
      query = query.eq("category", category);
    }

    const [servicesResult, settingsResult, rateResult] = await Promise.all([
      query,
      supabaseAdmin
        .from("platform_settings")
        .select("markup_percent, cashfree_fee_percent")
        .eq("id", 1)
        .maybeSingle(),
      supabaseAdmin
        .from("exchange_rates")
        .select("rate")
        .eq("base_currency", "USD")
        .eq("target_currency", "INR")
        .maybeSingle(),
    ]);

    if (servicesResult.error) {
      logger.error({ error: servicesResult.error }, "Failed to fetch services");
      return res.status(500).json({ error: "Failed to fetch services" });
    }

    const markupPercent = Number(settingsResult.data?.markup_percent ?? 20);
    const cashfreeFeePercent = Number(settingsResult.data?.cashfree_fee_percent ?? 2);
    const markup = markupPercent / 100;
    const cashfreeFee = cashfreeFeePercent / 100;
    const multiplier = (1 + markup) * (1 + cashfreeFee);
    const usdToInr = Number(rateResult.data?.rate ?? 93.4);

    let rows = servicesResult.data ?? [];

    if (search && typeof search === "string") {
      const term = search.toLowerCase();
      rows = rows.filter(
        (s) =>
          s.name?.toLowerCase().includes(term) ||
          s.category?.toLowerCase().includes(term)
      );
    }

    const services = rows.map((s) => ({
      service: s.service_id,
      name: s.name,
      type: s.type,
      category: s.category,
      description: s.description,
      min: s.min,
      max: s.max,
      rate: Number((Number(s.provider_rate) * usdToInr * multiplier).toFixed(4)),
    }));

    return res.json({ services });
  } catch (err) {
    logger.error({ err }, "Failed to fetch SMM services");
    return res.status(502).json({ error: "Failed to fetch services" });
  }
});

// ── GET /api/smm/categories ──────────────────────────────────────────────────
router.get("/categories", generalLimiter, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("smm_services_cache")
      .select("category")
      .not("category", "is", null);

    if (error) {
      logger.error({ error }, "Failed to fetch categories");
      return res.status(500).json({ error: "Failed to fetch categories" });
    }

    const categories = [
      ...new Set(data.map((r) => r.category).filter(Boolean) as string[]),
    ].sort();

    return res.json({ categories });
  } catch (err) {
    logger.error({ err }, "Failed to fetch categories");
    return res.status(502).json({ error: "Failed to fetch categories" });
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
// Price is computed from sell_rate_inr = provider_rate_inr * (1 + markup/100)
// User is charged in their wallet currency
const CreateOrderSchema = z.object({
  serviceId: z.number().int().positive(),
  serviceName: z.string().min(1).max(500),
  platform: z.string().min(1).max(100),
  link: z.string().url("Invalid URL"),
  quantity: z.number().int().positive(),
});

router.post("/order", requireAuth, orderLimiter, async (req, res) => {
  const userId = req.userId!;

  const parsed = CreateOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const { serviceId, serviceName, platform, link, quantity } = parsed.data;

  // 1. Fetch service + wallet in parallel
  const [serviceResult, walletResult] = await Promise.all([
    supabaseAdmin
      .from("smm_services_cache")
      .select("provider_rate, min, max")
      .eq("service_id", serviceId)
      .single(),
    supabaseAdmin
      .from("wallets")
      .select("id, balance, currency")
      .eq("user_id", userId)
      .single(),
  ]);

  if (serviceResult.error || !serviceResult.data) {
    res.status(400).json({ error: "Service not found. Admin must sync services first." });
    return;
  }

  if (walletResult.error || !walletResult.data) {
    res.status(400).json({ error: "Wallet not found" });
    return;
  }

  const wallet = walletResult.data;
  const providerRateUsd = Number(serviceResult.data.provider_rate);

  // Validate quantity against service limits
  if (quantity < serviceResult.data.min || quantity > serviceResult.data.max) {
    res.status(400).json({
      error: `Quantity must be between ${serviceResult.data.min} and ${serviceResult.data.max}`,
    });
    return;
  }

  // 2. Calculate all pricing from single helper
  const pricing = await calculatePricing(
    providerRateUsd,
    quantity,
    wallet.currency ?? "INR"
  );

  // 3. Check balance
  if (wallet.balance < pricing.userChargedAmount) {
    res.status(400).json({
      error: "Insufficient wallet balance",
      required: Number(pricing.userChargedAmount.toFixed(2)),
      available: Number(wallet.balance.toFixed(2)),
      currency: pricing.userChargedCurrency,
    });
    return;
  }

  // 4. Check provider balance (non-blocking)
  try {
    const providerBalance = await fetchBalance();
    if (parseFloat(providerBalance.balance) < pricing.providerCostUsd * 0.9) {
      logger.warn(
        { providerBalance: providerBalance.balance, providerCostUsd: pricing.providerCostUsd },
        "Provider balance low for order"
      );
    }
  } catch (err) {
    logger.warn({ err }, "Could not check provider balance, continuing");
  }

  // 5. Atomic balance deduction
  const { data: deductResult, error: deductErr } = await supabaseAdmin.rpc(
    "deduct_wallet_balance",
    {
      p_wallet_id: wallet.id,
      p_amount: pricing.userChargedAmount,
      p_expected_balance: wallet.balance,
    }
  );

  if (deductErr || !deductResult) {
    res.status(409).json({ error: "Balance update conflict, please retry" });
    return;
  }

  const newBalance = wallet.balance - pricing.userChargedAmount;

  // 6. Create order record
  const { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .insert({
      user_id: userId,
      service_id: String(serviceId),
      service_name: serviceName,
      platform,
      link,
      quantity,
      price: pricing.userChargedAmount,
      currency: pricing.userChargedCurrency,
      price_usd: pricing.userChargedInr / pricing.usdToInr,
      sell_rate_inr: pricing.sellRateInr,
      provider_cost_inr: pricing.providerCostInr,
      user_charged_inr: pricing.userChargedInr,
      status: "pending",
    })
    .select()
    .single();

  if (orderErr || !order) {
    await supabaseAdmin.rpc("credit_wallet_balance", {
      p_wallet_id: wallet.id,
      p_amount: pricing.userChargedAmount,
    });
    logger.error({ orderErr }, "Failed to create order record, balance refunded");
    res.status(500).json({ error: "Failed to create order record" });
    return;
  }

  // 7. Record debit transaction
  await supabaseAdmin.from("wallet_transactions").insert({
    wallet_id: wallet.id,
    user_id: userId,
    type: "purchase",
    amount: pricing.userChargedAmount,
    description: `Order: ${serviceName}`,
    reference_id: order.id,
    balance_after: newBalance,
  });

  // 8. Submit to provider
  try {
    // const providerOrder = await submitOrder({ service: serviceId, link, quantity });
    // const externalOrderId = String(providerOrder.order);
    const externalOrderId = "test_kgnshdsunhds";

    await Promise.all([
      supabaseAdmin
        .from("orders")
        .update({
          external_order_id: externalOrderId,
          status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id),

      supabaseAdmin.from("margin_ledger").insert({
        order_id: order.id,
        user_id: userId,
        user_charged_amount: pricing.userChargedAmount,
        user_charged_currency: pricing.userChargedCurrency,
        user_charged_inr_equivalent: pricing.userChargedInr,
        provider_cost_inr: pricing.providerCostInr,
        margin_inr: pricing.marginInr,
        cashfree_fee_inr: pricing.cashfreeFeeInr,
        markup_percent_applied: pricing.markupPercent,
        cashfree_fee_percent_applied: pricing.cashfreeFeePercent,
        usd_to_inr_rate: pricing.usdToInr,
      }),
    ]);

    logger.info(
      {
        orderId: order.id,
        externalOrderId,
        userChargedInr: pricing.userChargedInr,
        providerCostInr: pricing.providerCostInr,
        marginInr: pricing.marginInr,
      },
      "Order submitted successfully"
    );

    res.status(201).json({
      success: true,
      orderId: order.id,
      externalOrderId,
      charged: Number(pricing.userChargedAmount.toFixed(2)),
      currency: pricing.userChargedCurrency,
    });
  } catch (err) {
    // Provider failed — refund
    await supabaseAdmin.rpc("credit_wallet_balance", {
      p_wallet_id: wallet.id,
      p_amount: pricing.userChargedAmount,
    });

    const { data: freshWallet } = await supabaseAdmin
      .from("wallets")
      .select("balance")
      .eq("id", wallet.id)
      .single();

    await Promise.all([
      supabaseAdmin.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        user_id: userId,
        type: "refund",
        amount: pricing.userChargedAmount,
        description: `Refund: provider rejected order`,
        reference_id: order.id,
        balance_after: freshWallet?.balance ?? newBalance + pricing.userChargedAmount,
      }),
      supabaseAdmin
        .from("orders")
        .update({
          status: "cancelled",
          error_message: err instanceof Error ? err.message : "Provider error",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id),
    ]);

    logger.error({ err, orderId: order.id }, "Provider failed, refunded");
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
