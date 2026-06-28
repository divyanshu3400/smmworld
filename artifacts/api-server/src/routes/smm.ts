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
// Returns services from cache (not live API call), enriched with sell_rate_inr
router.get("/services", generalLimiter, async (req, res) => {
  try {
    const [servicesResult, settingsResult] = await Promise.all([
      supabaseAdmin
        .from("smm_services_cache")
        .select("*")
        .order("name", { ascending: true }),
      supabaseAdmin
        .from("platform_settings")
        .select("markup_percent")
        .eq("id", 1)
        .maybeSingle(),
    ]);

    if (servicesResult.error) {
      logger.error({ error: servicesResult.error }, "Failed to fetch services from cache");
      return res.status(500).json({ error: "Failed to fetch services" });
    }

    const markupPercent = Number(settingsResult.data?.markup_percent ?? 20);
    const services = (servicesResult.data || []).map((s) => ({
      service: s.service_id,
      name: s.name,
      type: s.type,
      category: s.category,
      description: s.description,
      rate: s.provider_rate_inr ? (Number(s.provider_rate_inr) * (1 + markupPercent / 100)).toFixed(4) : s.provider_rate,
      provider_rate: s.provider_rate,
      min: s.min,
      max: s.max,
    }));

    return res.json({ services, markup_percent: markupPercent });
  } catch (err) {
    logger.error({ err }, "Failed to fetch SMM services");
    return res.status(502).json({ error: "Failed to fetch services" });
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

// ── Helper: convert amount to USD for wallet comparison ────────────────────────
async function convertToUsd(amountInr: number): Promise<number> {
  const { data } = await supabaseAdmin
    .from("exchange_rates")
    .select("rate")
    .eq("base_currency", "USD")
    .eq("target_currency", "INR")
    .maybeSingle();

  if (!data?.rate) {
    // Fallback rate
    return amountInr / 83.5;
  }

  return amountInr / Number(data.rate);
}

// ── Helper: convert amount to INR ───────────────────────────────────────────────
async function convertToInr(amountUsd: number): Promise<number> {
  const { data } = await supabaseAdmin
    .from("exchange_rates")
    .select("rate")
    .eq("base_currency", "USD")
    .eq("target_currency", "INR")
    .maybeSingle();

  if (!data?.rate) {
    return amountUsd * 83.5;
  }

  return amountUsd * Number(data.rate);
}

// ── POST /api/smm/order ──────────────────────────────────────────────────────
// Price is computed from sell_rate_inr = provider_rate_inr * (1 + markup/100)
// User is charged in their wallet currency
const CreateOrderSchema = z.object({
  serviceId: z.number().int().positive(),
  serviceName: z.string().min(1).max(500),
  platform: z.string().min(1).max(100),
  link: z.string().url("Invalid URL"),
  quantity: z.number().int().positive(),
  // priceUsd is deprecated - price is now computed server-side
  priceUsd: z.number().positive().optional(),
});

router.post("/order", requireAuth, orderLimiter, async (req, res) => {
  const userId = req.userId!;

  const parsed = CreateOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const { serviceId, serviceName, platform, link, quantity } = parsed.data;

  // 1. Get pricing info from cache
  const pricing = await getServiceSellRate(serviceId);
  if (!pricing) {
    // Service not in cache - try to sync first or reject
    res.status(400).json({ error: "Service not found in catalog. Admin must sync services first." });
    return;
  }

  const { sellRateInr, providerRateInr, markupPercent } = pricing;

  // Calculate cost: sell_rate_inr is per 1000 units
  const userChargedInr = (sellRateInr * quantity) / 1000;
  const providerCostInr = (providerRateInr * quantity) / 1000;

  // 2. Check provider balance before accepting order
  try {
    const providerBalance = await fetchBalance();
    const providerBalanceNum = parseFloat(providerBalance.balance);

    // Provider cost in USD (provider uses USD typically)
    const providerCostUsd = providerCostInr / (await (async () => {
      const { data } = await supabaseAdmin
        .from("exchange_rates")
        .select("rate")
        .eq("base_currency", "USD")
        .eq("target_currency", "INR")
        .maybeSingle();
      return Number(data?.rate ?? 83.5);
    })());

    if (providerBalanceNum < providerCostUsd * 0.9) {
      // Warn but don't block - let admin know balance is low
      logger.warn(
        { providerBalance: providerBalanceNum, providerCostUsd },
        "Provider balance too low for order"
      );
    }
  } catch (err) {
    logger.warn({ err }, "Could not check provider balance, continuing anyway");
  }

  // 3. Get user wallet
  const { data: wallet, error: walletErr } = await supabaseAdmin
    .from("wallets")
    .select("id, balance, currency")
    .eq("user_id", userId)
    .single();

  if (walletErr || !wallet) {
    res.status(400).json({ error: "Wallet not found" });
    return;
  }

  // 4. Convert user charge to wallet currency for comparison
  let chargeInWalletCurrency: number;
  let userChargedAmount: number;
  let userChargedCurrency: string;

  if (wallet.currency === "INR") {
    chargeInWalletCurrency = userChargedInr;
    userChargedAmount = userChargedInr;
    userChargedCurrency = "INR";
  } else {
    // Convert INR price to wallet currency (via USD)
    const userChargedUsd = await convertToUsd(userChargedInr);
    chargeInWalletCurrency = userChargedUsd;
    userChargedAmount = userChargedUsd;
    userChargedCurrency = wallet.currency || "USD";
  }

  // 5. Check balance
  if (wallet.balance < chargeInWalletCurrency) {
    res.status(400).json({
      error: "Insufficient wallet balance",
      required: chargeInWalletCurrency,
      currency: userChargedCurrency,
    });
    return;
  }

  // 6. Deduct balance atomically
  const newBalance = wallet.balance - chargeInWalletCurrency;
  const { data: deducted, error: deductErr } = await supabaseAdmin
    .from("wallets")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("id", wallet.id)
    .eq("balance", wallet.balance)
    .select("id");

  if (deductErr || !deducted || deducted.length === 0) {
    res.status(409).json({ error: "Balance update conflict, please retry" });
    return;
  }

  // 7. Create local order record (pending)
  const orderPriceUsd = userChargedCurrency === "USD" ? userChargedAmount : await convertToUsd(userChargedInr);

  const { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .insert({
      user_id: userId,
      service_id: String(serviceId),
      service_name: serviceName,
      platform,
      link,
      quantity,
      price: chargeInWalletCurrency,
      currency: userChargedCurrency,
      price_usd: orderPriceUsd,
      sell_rate_inr: sellRateInr,
      provider_cost_inr: providerCostInr,
      user_charged_inr: userChargedInr,
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

  // 8. Record debit transaction
  await supabaseAdmin.from("wallet_transactions").insert({
    wallet_id: wallet.id,
    user_id: userId,
    type: "purchase",
    amount: chargeInWalletCurrency,
    description: `Order: ${serviceName}`,
    reference_id: order.id,
    balance_after: newBalance,
  });

  // 9. Submit to WorldOfSMM
  let externalOrderId: string | null = null;
  try {
    const providerOrder = await submitOrder({ service: serviceId, link, quantity });
    externalOrderId = String(providerOrder.order);

    // 10. Update order with provider ID and processing status
    await supabaseAdmin
      .from("orders")
      .update({
        external_order_id: externalOrderId,
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    // 11. Create margin ledger entry
    await supabaseAdmin.from("margin_ledger").insert({
      order_id: order.id,
      user_id: userId,
      user_charged_amount: userChargedAmount,
      user_charged_currency: userChargedCurrency,
      user_charged_inr_equivalent: userChargedInr,
      provider_cost_inr: providerCostInr,
      markup_percent_applied: markupPercent,
    });

    logger.info({ orderId: order.id, externalOrderId, userChargedInr, providerCostInr }, "Order submitted successfully");
    res.status(201).json({
      success: true,
      orderId: order.id,
      externalOrderId,
      charged: userChargedAmount,
      currency: userChargedCurrency,
    });
  } catch (err) {
    // 12. Provider failed — refund user
    const refundBalance = wallet.balance; // original balance
    await supabaseAdmin
      .from("wallets")
      .update({ balance: refundBalance, updated_at: new Date().toISOString() })
      .eq("id", wallet.id);

    await supabaseAdmin.from("wallet_transactions").insert({
      wallet_id: wallet.id,
      user_id: userId,
      type: "refund",
      amount: chargeInWalletCurrency,
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
