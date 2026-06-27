import { Router } from "express";
import crypto from "crypto";
import { requireAuth } from "../lib/auth";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { logger } from "../lib/logger";
import {
  createOrder as gatewayCreateOrder,
  fetchPaymentStatus,
  resolveActiveProviders,
  isProviderConfigured,
  type ProviderKey,
  type PaymentSettings,
} from "../services/paymentGateway";
import { creditWallet, getRazorpay } from "./paymentHelpers";

const router = Router();

// ── Helpers for the multi-gateway flow ──────────────────────────────────────

async function getPaymentSettings(): Promise<PaymentSettings> {
  const { data } = await supabaseAdmin
    .from("payment_settings")
    .select("razorpay_enabled, cashfree_enabled, payu_enabled, gateway_priority, min_topup_inr")
    .eq("id", 1)
    .maybeSingle();

  if (!data) {
    return {
      razorpay_enabled: false,
      cashfree_enabled: false,
      payu_enabled: false,
      gateway_priority: ["cashfree", "payu", "razorpay"],
      min_topup_inr: 1,
    };
  }
  return data as PaymentSettings;
}

// ── POST /api/payment/razorpay/create-order ───────────────────────────────────
router.post("/razorpay/create-order", requireAuth, async (req, res) => {
  try {
    const { amountINR } = req.body;
    const parsed = Number(amountINR);
    if (!amountINR || isNaN(parsed) || parsed < 1) {
      return res.status(400).json({ error: "Invalid amount. Minimum ₹1." });
    }

    const razorpay = getRazorpay();
    const amountPaise = Math.round(parsed * 100);

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    return res.json({
      orderId: order.id,
      amount: amountPaise,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown";
    if (msg.includes("not configured")) return res.status(503).json({ error: "Payment gateway not configured" });
    logger.error({ err }, "Razorpay create-order error");
    return res.status(500).json({ error: "Failed to create payment order" });
  }
});

// ── POST /api/payment/razorpay/verify ────────────────────────────────────────
//
// Idempotency design (insert-first pattern):
//   - The transaction record is inserted BEFORE the wallet is updated.
//   - `wallet_transactions.reference_id` carries a unique constraint, so only
//     ONE request per payment_id can ever insert a row.
//   - The winner inserts the row and then updates the wallet.
//   - Any concurrent duplicate request gets a 23505 unique violation during
//     insert and returns the existing credit WITHOUT touching the wallet.
//   - This eliminates the TOCTOU race where two requests both read the wallet,
//     both update it, and then one fails on the tx insert.
router.post("/razorpay/verify", requireAuth, async (req, res) => {
  const userId = (req as { userId?: string }).userId as string;

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing payment verification fields" });
  }

  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_secret) return res.status(503).json({ error: "Payment gateway not configured" });

  // ── 1. Verify HMAC-SHA256 signature ────────────────────────────────────────
  const expectedSig = crypto
    .createHmac("sha256", key_secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(razorpay_signature))) {
    logger.warn({ userId, razorpay_order_id }, "Razorpay signature mismatch");
    return res.status(400).json({ error: "Payment verification failed: invalid signature" });
  }

  try {
    // ── 2. Fetch payment from Razorpay (authoritative — never trust client body) ─
    const razorpay = getRazorpay();
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.order_id !== razorpay_order_id) {
      logger.warn({ userId, razorpay_order_id, payment_order_id: payment.order_id }, "Payment order_id mismatch");
      return res.status(400).json({ error: "Payment does not match the expected order" });
    }
    if (payment.status !== "captured") {
      logger.warn({ userId, razorpay_payment_id, status: payment.status }, "Payment not captured");
      return res.status(400).json({ error: `Payment not completed (status: ${payment.status})` });
    }
    if (payment.currency !== "INR") {
      return res.status(400).json({ error: "Only INR payments are accepted" });
    }

    const amountINR = Number(payment.amount) / 100;
    if (amountINR <= 0) {
      return res.status(400).json({ error: "Payment amount is zero" });
    }

    // ── 3. Credit wallet (creditWallet handles currency locking + FX) ────────
    const { newBalance, duplicate, currency: walletCurrency } = await creditWallet(
      userId,
      amountINR,
      "INR",
      "razorpay",
      razorpay_payment_id
    );

    logger.info({ userId, razorpay_payment_id, amountINR, walletCurrency, newBalance, duplicate }, "Wallet credited via Razorpay");

    return res.json({
      success: true,
      creditedAmount: amountINR,
      currency: walletCurrency,
      newBalance,
      paymentId: razorpay_payment_id,
      duplicate,
    });
  } catch (err: unknown) {
    logger.error({ err, userId, razorpay_payment_id }, "Razorpay verify error");
    return res.status(500).json({ error: "Payment verification failed" });
  }
});

// ── GET /api/payment/gateways ────────────────────────────────────────────────
// Public (auth required) — returns which gateways are active so the wallet
// UI can render the method picker. Does NOT expose keys.
router.get("/gateways", requireAuth, async (req, res) => {
  try {
    const settings = await getPaymentSettings();
    const active = resolveActiveProviders(settings);
    return res.json({
      gateways: active,
      minTopupINR: Number(settings.min_topup_inr),
      // Tell the frontend which providers are configured (keys present) even
      // if not enabled, so the admin UI can show "configured but off".
      configured: {
        razorpay: isProviderConfigured("razorpay"),
        cashfree: isProviderConfigured("cashfree"),
        payu: isProviderConfigured("payu"),
      },
    });
  } catch (err) {
    logger.error({ err }, "Failed to fetch gateway settings");
    return res.status(500).json({ error: "Failed to load payment methods" });
  }
});

// ── POST /api/payment/create-order ──────────────────────────────────────────
// Creates a payment order with the primary active gateway. If that gateway
// fails (down / misconfigured), falls back to the next enabled gateway.
// Returns the provider + everything the frontend needs to launch the payment.
router.post("/create-order", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const amountINR = Number(req.body?.amountINR);

  if (!amountINR || amountINR < 1) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    const settings = await getPaymentSettings();
    if (amountINR < Number(settings.min_topup_inr)) {
      return res.status(400).json({
        error: `Minimum top-up is ₹${settings.min_topup_inr}`,
      });
    }

    const active = resolveActiveProviders(settings);
    if (active.length === 0) {
      return res.status(503).json({ error: "No payment gateway is currently active" });
    }

    // Fetch user email for the gateway's customer details.
    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
    const customerEmail = user?.email || "customer@example.com";

    // Try each active provider in priority order until one succeeds.
    let lastError: string | undefined;
    for (const provider of active) {
      const orderId = crypto.randomUUID();

      // Insert a pending payment_orders row.
      const { error: insertErr } = await supabaseAdmin.from("payment_orders").insert({
        id: orderId,
        user_id: userId,
        provider,
        amount_inr: amountINR,
        status: "pending",
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });

      if (insertErr) {
        logger.error({ insertErr, userId, provider }, "Failed to insert payment_orders");
        lastError = "Failed to create order record";
        continue;
      }

      try {
        const result = await gatewayCreateOrder(provider, {
          amountINR,
          customerId: userId,
          customerEmail,
          orderId,
        });

        // Store the provider order id.
        await supabaseAdmin
          .from("payment_orders")
          .update({ provider_order_id: result.providerOrderId })
          .eq("id", orderId);

        return res.json({
          orderId,
          provider: result.provider,
          providerOrderId: result.providerOrderId,
          sessionId: result.sessionId,
          redirectUrl: result.redirectUrl,
          redirectParams: result.redirectParams,
          amountINR,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gateway error";
        logger.warn({ provider, msg, userId }, "Provider create-order failed, trying fallback");
        lastError = msg;

        // Mark this attempt failed and continue to the next provider.
        await supabaseAdmin
          .from("payment_orders")
          .update({ status: "failed", failure_reason: msg })
          .eq("id", orderId);
      }
    }

    return res.status(502).json({
      error: "All payment gateways failed. Please try again later.",
      detail: lastError,
    });
  } catch (err) {
    logger.error({ err, userId }, "create-order error");
    return res.status(500).json({ error: "Failed to create payment order" });
  }
});

// ── POST /api/payment/verify ─────────────────────────────────────────────────
// Verifies a payment by polling the gateway's status API. Called by the
// frontend after the user completes the payment (Cashfree SDK callback or
// PayU redirect back). Credits the wallet if status is paid.
router.post("/verify", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const { orderId } = req.body as { orderId?: string };

  if (!orderId) {
    return res.status(400).json({ error: "Missing orderId" });
  }

  try {
    const { data: order, error } = await supabaseAdmin
      .from("payment_orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status === "paid") {
      return res.json({
        success: true,
        alreadyCredited: true,
        provider: order.provider,
        amountINR: Number(order.amount_inr),
        currency: "INR",
      });
    }

    if (order.provider === "razorpay") {
      // Razorpay has its own dedicated verify route with signature checking.
      return res.status(400).json({
        error: "Use the Razorpay-specific verify endpoint for Razorpay orders",
      });
    }

    if (!order.provider_order_id) {
      return res.status(400).json({ error: "Order has no provider order id" });
    }

    const status = await fetchPaymentStatus(
      order.provider as ProviderKey,
      order.provider_order_id
    );

    if (status.status !== "paid") {
      return res.json({
        success: false,
        status: status.status,
        message: status.status === "pending"
          ? "Payment is still being processed. If you have paid, please wait a moment and try again."
          : "Payment was not completed or failed. Please try again.",
      });
    }

    // Verify the amount matches what the user claimed — fraud guard.
    if (status.amountINR && Math.abs(status.amountINR - Number(order.amount_inr)) > 0.01) {
      logger.error(
        {
          orderId,
          expected: order.amount_inr,
          actual: status.amountINR,
          userId,
        },
        "Amount mismatch — possible fraud attempt"
      );
      await supabaseAdmin
        .from("payment_orders")
        .update({
          status: "failed",
          failure_reason: `Amount mismatch: expected ₹${order.amount_inr}, got ₹${status.amountINR}`,
        })
        .eq("id", orderId);
      return res.status(400).json({
        error: "Payment amount does not match the order amount. Please contact support.",
      });
    }

    const amountINR = Number(order.amount_inr);

    const { newBalance, duplicate, currency: walletCurrency } = await creditWallet(
      userId,
      amountINR,
      "INR",
      order.provider as ProviderKey,
      status.providerPaymentId || order.provider_order_id
    );

    // Mark the order paid.
    await supabaseAdmin
      .from("payment_orders")
      .update({
        status: "paid",
        provider_payment_id: status.providerPaymentId,
        amount_usd: walletCurrency === "INR" ? null : amountINR,
        paid_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    logger.info(
      { userId, orderId, provider: order.provider, amountINR, walletCurrency, duplicate },
      "Wallet credited via gateway"
    );

    return res.json({
      success: true,
      duplicate,
      provider: order.provider,
      amountINR,
      currency: walletCurrency,
      newBalance,
    });
  } catch (err) {
    logger.error({ err, userId, orderId }, "verify error");
    return res.status(500).json({ error: "Payment verification failed" });
  }
});

// ── GET /api/payment/order/:id/status ───────────────────────────────────────
// Lightweight poll for the frontend to check if a payment has been confirmed
// (e.g. while waiting on a UPI Collect approval). Does NOT credit — that only
// happens via /verify. Returns the current payment_orders.status.
router.get("/order/:id/status", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const { id } = req.params;

  const { data: order, error } = await supabaseAdmin
    .from("payment_orders")
    .select("status, provider, amount_inr, amount_usd, provider_payment_id")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !order) {
    return res.status(404).json({ error: "Order not found" });
  }

  return res.json({
    status: order.status,
    provider: order.provider,
    amountINR: Number(order.amount_inr),
    amountUSD: order.amount_usd ? Number(order.amount_usd) : null,
    providerPaymentId: order.provider_payment_id,
  });
});

export default router;
