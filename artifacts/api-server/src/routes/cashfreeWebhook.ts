import { Router } from "express";
import express from "express";
import crypto from "crypto";
import { logger } from "../lib/logger";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { creditWallet } from "./paymentHelpers";

const webhookRouter = Router();

webhookRouter.post(
    "/cashfree/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        const signature = req.headers["x-webhook-signature"] as string;
        const timestamp = req.headers["x-webhook-timestamp"] as string;
        const webhookVersion = req.headers["x-webhook-version"] as string;
        const rawBody = req.body.toString("utf-8");

        // ── 1. Verify signature ──────────────────────────────────────────────────
        const secret = process.env.CASHFREE_WEBHOOK_SECRET;
        if (!secret) {
            logger.error("CASHFREE_WEBHOOK_SECRET not set");
            return res.status(500).end();
        }

        const computed = crypto
            .createHmac("sha256", secret)
            .update(`${timestamp}${rawBody}`)
            .digest("base64");

        if (computed !== signature) {
            logger.warn({ timestamp }, "Cashfree webhook: invalid signature");
            return res.status(400).json({ error: "Invalid signature" });
        }

        // ── 2. Guard against unknown webhook versions ────────────────────────────
        const SUPPORTED_VERSIONS = ["2023-08-01", "2025-01-01"];
        if (!SUPPORTED_VERSIONS.includes(webhookVersion)) {
            logger.warn({ webhookVersion }, "Cashfree webhook: unsupported version — check field mappings");
            // Still ack so Cashfree doesn't retry endlessly, but alert yourself
        }

        // ── 3. Parse event ───────────────────────────────────────────────────────
        let event: any;
        try {
            event = JSON.parse(rawBody);
        } catch {
            return res.status(400).json({ error: "Invalid JSON" });
        }

        const eventType: string = event.type;
        const paymentData = event?.data?.payment;
        const orderData = event?.data?.order;

        // Only handle success — ignore refunds, disputes etc. here
        if (eventType !== "PAYMENT_SUCCESS_WEBHOOK") {
            logger.info({ eventType }, "Cashfree webhook: ignoring non-success event");
            return res.status(200).json({ received: true });
        }

        const providerOrderId: string = orderData?.order_id;
        const providerPaymentId: string = paymentData?.cf_payment_id?.toString();

        // Use order_amount (pre-discount) for fraud check, payment_amount for actual credit.
        // Cashfree can send payment_amount < order_amount when offers/coupons are applied.
        const paymentAmountINR: number = Number(paymentData?.payment_amount); // actually charged
        const orderAmountINR: number = Number(orderData?.order_amount);       // original order value

        if (!providerOrderId || !providerPaymentId || !paymentAmountINR) {
            logger.error({ event }, "Cashfree webhook: missing fields in payload");
            return res.status(400).json({ error: "Missing payment fields" });
        }

        try {
            // ── 4. Look up our payment_orders row by provider_order_id ───────────
            const { data: order, error: orderErr } = await supabaseAdmin
                .from("payment_orders")
                .select("*")
                .eq("provider_order_id", providerOrderId)
                .eq("provider", "cashfree")
                .maybeSingle();

            if (orderErr || !order) {
                logger.warn({ providerOrderId }, "Cashfree webhook: order not found");
                return res.status(200).json({ received: true });
            }

            // ── 5. Already paid? Idempotent — just ack ───────────────────────────
            if (order.status === "paid") {
                logger.info({ providerOrderId }, "Cashfree webhook: already credited, skipping");
                return res.status(200).json({ received: true });
            }

            // ── 6. Amount sanity check ────────────────────────────────────────────
            // Rules:
            //   a) payment_amount must be > 0
            //   b) payment_amount must NOT exceed the order amount we created (no one pays more than asked)
            //   c) payment_amount can be LESS than order_amount only if a discount/offer was applied —
            //      Cashfree handles that legitimately. We compare against order_amount from the webhook
            //      (which matches what we stored at order-creation time).
            //
            // We do NOT do strict equality because offers reduce payment_amount below order_amount.
            const expectedAmountINR = Number(order.amount_inr);
            const amountExceedsOrder = paymentAmountINR > expectedAmountINR + 0.01;
            const amountIsZeroOrNegative = paymentAmountINR <= 0;

            if (amountIsZeroOrNegative || amountExceedsOrder) {
                logger.error(
                    {
                        providerOrderId,
                        expected: expectedAmountINR,
                        orderAmountFromWebhook: orderAmountINR,
                        actualPayment: paymentAmountINR,
                    },
                    "Cashfree webhook: amount fraud check failed"
                );
                await supabaseAdmin
                    .from("payment_orders")
                    .update({
                        status: "failed",
                        failure_reason: `Amount fraud check: expected ≤₹${expectedAmountINR}, got ₹${paymentAmountINR}`,
                    })
                    .eq("id", order.id);
                return res.status(200).json({ received: true }); // always 200 to Cashfree
            }

            // ── 7. Get platform settings for gateway fee ─────────────────────────────
            const { data: platformSettings } = await supabaseAdmin
                .from("platform_settings")
                .select("cashfree_fee_percent")
                .eq("id", 1)
                .maybeSingle();

            const feePercent = Number(platformSettings?.cashfree_fee_percent ?? 0);
            const feeAmountINR = paymentAmountINR * (feePercent / 100);
            const netCreditINR = paymentAmountINR - feeAmountINR;

            // ── 8. Credit wallet (creditWallet handles currency locking + FX) ──────
            // Credit the net amount (after fee deduction), not the full payment amount.
            const feeNote = feePercent > 0
                ? ` (Gateway fee ${feePercent}%: ₹${feeAmountINR.toFixed(2)} deducted from ₹${paymentAmountINR.toFixed(2)})`
                : "";

            const { newBalance, duplicate, currency: walletCurrency } = await creditWallet(
                order.user_id,
                netCreditINR,
                "INR",
                "cashfree",
                providerPaymentId,
                feeNote
            );

            // ── 9. Mark order paid ────────────────────────────────────────────────
            await supabaseAdmin
                .from("payment_orders")
                .update({
                    status: "paid",
                    provider_payment_id: providerPaymentId,
                    amount_usd: walletCurrency === "INR" ? null : netCreditINR,
                    paid_at: new Date().toISOString(),
                })
                .eq("id", order.id);

            logger.info(
                {
                    userId: order.user_id,
                    providerOrderId,
                    providerPaymentId,
                    orderAmountINR,
                    paymentAmountINR,
                    feePercent,
                    feeAmountINR,
                    netCreditINR,
                    walletCurrency,
                    newBalance,
                    duplicate,
                    webhookVersion,
                },
                "Cashfree webhook: wallet credited"
            );

            return res.status(200).json({ received: true });
        } catch (err) {
            logger.error({ err, providerOrderId }, "Cashfree webhook: processing error");
            // 500 so Cashfree retries (up to 5 times)
            return res.status(500).json({ error: "Processing failed" });
        }
    }
);
export default webhookRouter;