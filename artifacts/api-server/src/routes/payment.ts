import { Router } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { requireAuth } from "../lib/auth";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { logger } from "../lib/logger";

const router = Router();

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new Error("Razorpay keys not configured");
  return new Razorpay({ key_id, key_secret });
}

async function getINRtoUSD(): Promise<number> {
  const { data } = await supabaseAdmin
    .from("exchange_rates")
    .select("rate")
    .eq("target_currency", "INR")
    .single();
  return data?.rate || 83.5;
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

    // ── 3. Convert INR → USD ─────────────────────────────────────────────────
    const inrRate = await getINRtoUSD();
    const amountUSD = amountINR / inrRate;

    // ── 4. Fetch wallet ──────────────────────────────────────────────────────
    const { data: wallet, error: walletErr } = await supabaseAdmin
      .from("wallets")
      .select("id, balance")
      .eq("user_id", userId)
      .single();

    if (walletErr || !wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    const newBalance = wallet.balance + amountUSD;

    // ── 5. INSERT transaction FIRST (atomic idempotency gate) ────────────────
    //
    // Only ONE concurrent request per razorpay_payment_id can succeed here.
    // The unique constraint on reference_id (wallet_transactions) ensures this.
    // The loser gets 23505 and returns the existing credit without touching
    // the wallet — eliminating the double-credit race window.
    const { error: txErr } = await supabaseAdmin.from("wallet_transactions").insert({
      wallet_id: wallet.id,
      user_id: userId,
      type: "credit",
      amount: amountUSD,
      description: `Wallet top-up via Razorpay (₹${amountINR.toFixed(2)})`,
      reference_id: razorpay_payment_id,
      balance_after: newBalance,
    });

    if (txErr) {
      if (txErr.code === "23505") {
        // Duplicate request: this payment_id was already processed.
        // Return the original credited amount — wallet is untouched.
        logger.info({ userId, razorpay_payment_id }, "Duplicate verify — payment_id already recorded");
        const { data: existingTx } = await supabaseAdmin
          .from("wallet_transactions")
          .select("amount, balance_after")
          .eq("reference_id", razorpay_payment_id)
          .eq("user_id", userId)
          .eq("type", "credit")
          .maybeSingle();

        return res.json({
          success: true,
          creditedUSD: existingTx?.amount ?? amountUSD,
          newBalance: existingTx?.balance_after ?? wallet.balance,
          paymentId: razorpay_payment_id,
          duplicate: true,
        });
      }
      throw txErr;
    }

    // ── 6. We won the insert race — now credit the wallet ────────────────────
    //
    // Since only one request per payment_id can reach this line, the update
    // is safe. We use the balance we read in step 4 as the basis.
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from("wallets")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("id", wallet.id)
      .select("id");

    if (updateErr || !updated || updated.length === 0) {
      // Wallet update failed after tx was already inserted. Log for manual review.
      logger.error(
        { userId, razorpay_payment_id, amountUSD, walletId: wallet.id, updateErr },
        "CRITICAL: tx inserted but wallet update failed — manual reconciliation needed"
      );
      // Still return success since the tx is recorded; ops team can reconcile.
      return res.json({ success: true, creditedUSD: amountUSD, newBalance, paymentId: razorpay_payment_id });
    }

    logger.info({ userId, razorpay_payment_id, amountINR, amountUSD, newBalance }, "Wallet credited via Razorpay");

    return res.json({
      success: true,
      creditedUSD: amountUSD,
      newBalance,
      paymentId: razorpay_payment_id,
    });
  } catch (err: unknown) {
    logger.error({ err, userId, razorpay_payment_id }, "Razorpay verify error");
    return res.status(500).json({ error: "Payment verification failed" });
  }
});

export default router;
