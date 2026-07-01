import { Router } from "express";
import express from "express";
import crypto from "crypto";
import { logger } from "../lib/logger";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { creditWallet } from "./paymentHelpers";
import { sendGuestMagicLink } from "./authHelpers";
import { placeOrderForUser } from "./orderHelpers";

const webhookRouter = Router();

webhookRouter.post(
    "/cashfree/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        const signature = req.headers["x-webhook-signature"] as string;
        const timestamp = req.headers["x-webhook-timestamp"] as string;
        const webhookVersion = req.headers["x-webhook-version"] as string;
        const rawBody = req.body.toString("utf-8");

        // ── 1. Verify signature ────────────────────────────────────────────────
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

        // ── 2. Guard against unknown webhook versions ──────────────────────────
        const SUPPORTED_VERSIONS = ["2023-08-01", "2025-01-01"];
        if (!SUPPORTED_VERSIONS.includes(webhookVersion)) {
            logger.warn({ webhookVersion }, "Cashfree webhook: unsupported version — check field mappings");
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

        if (eventType !== "PAYMENT_SUCCESS_WEBHOOK") {
            logger.info({ eventType }, "Cashfree webhook: ignoring non-success event");
            return res.status(200).json({ received: true });
        }

        const providerOrderId: string = orderData?.order_id;
        const providerPaymentId: string = paymentData?.cf_payment_id?.toString();
        const paymentAmountINR: number = Number(paymentData?.payment_amount);
        const orderAmountINR: number = Number(orderData?.order_amount);

        if (!providerOrderId || !providerPaymentId || !paymentAmountINR) {
            logger.error({ event }, "Cashfree webhook: missing fields in payload");
            return res.status(400).json({ error: "Missing payment fields" });
        }

        try {
            // ── 4. Look up our payment_orders row ───────────────────────────────
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

            // ── 5. Idempotency guard ─────────────────────────────────────────────
            if (order.status === "paid") {
                logger.info({ providerOrderId }, "Cashfree webhook: already processed, skipping");
                return res.status(200).json({ received: true });
            }

            // ── 6. Amount sanity check ────────────────────────────────────────────
            const expectedAmountINR = Number(order.amount_inr);
            const amountExceedsOrder = paymentAmountINR > expectedAmountINR + 0.01;
            const amountIsZeroOrNegative = paymentAmountINR <= 0;

            if (amountIsZeroOrNegative || amountExceedsOrder) {
                logger.error(
                    { providerOrderId, expected: expectedAmountINR, orderAmountFromWebhook: orderAmountINR, actualPayment: paymentAmountINR },
                    "Cashfree webhook: amount fraud check failed"
                );
                await supabaseAdmin
                    .from("payment_orders")
                    .update({
                        status: "failed",
                        failure_reason: `Amount fraud check: expected ≤₹${expectedAmountINR}, got ₹${paymentAmountINR}`,
                    })
                    .eq("id", order.id);
                return res.status(200).json({ received: true });
            }

            // ── 7. Determine fee handling based on purpose ──────────────────────
            // wallet_topup: gateway fee is deducted from the credited amount.
            // guest_order: fee is already priced into the service rate at
            // checkout time — do NOT deduct it again here, or the customer
            // effectively gets charged the fee twice.
            let netCreditINR = paymentAmountINR;
            let feeNote = "";

            if (order.purpose === "wallet_topup") {
                const { data: platformSettings } = await supabaseAdmin
                    .from("platform_settings")
                    .select("cashfree_fee_percent")
                    .eq("id", 1)
                    .maybeSingle();

                const feePercent = Number(platformSettings?.cashfree_fee_percent ?? 0);
                const feeAmountINR = paymentAmountINR * (feePercent / 100);
                netCreditINR = paymentAmountINR - feeAmountINR;
                feeNote = feePercent > 0
                    ? ` (Gateway fee ${feePercent}%: ₹${feeAmountINR.toFixed(2)} deducted from ₹${paymentAmountINR.toFixed(2)})`
                    : "";
            }

            // ── 8. Credit wallet ──────────────────────────────────────────────────
            const { newBalance, duplicate, currency: walletCurrency } = await creditWallet(
                order.user_id,
                netCreditINR,
                "INR",
                "cashfree",
                providerPaymentId,
                order.purpose === "guest_order" ? "Payment for order" : `Wallet top-up${feeNote}`
            );

            // ── 9. Mark payment order paid ──────────────────────────────────────
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
                    userId: order.user_id, providerOrderId, providerPaymentId, purpose: order.purpose,
                    orderAmountINR, paymentAmountINR, netCreditINR, walletCurrency, newBalance, duplicate, webhookVersion,
                },
                "Cashfree webhook: wallet credited"
            );

            // ── 10. Guest order: place the SMM order now that funds have landed ──
            if (order.purpose === "guest_order") {
                const meta = order.metadata as {
                    serviceId: string; serviceName: string; platform: string;
                    link: string; quantity: number; isExistingAccount: boolean;
                };

                try {
                    await placeOrderForUser(order.user_id, {
                        serviceId: meta.serviceId,
                        serviceName: meta.serviceName,
                        platform: meta.platform,
                        link: meta.link,
                        quantity: meta.quantity,
                    });

                    if (!meta.isExistingAccount) {
                        await sendGuestMagicLink(order.user_id);
                    }

                    logger.info({ userId: order.user_id, providerOrderId }, "Cashfree webhook: guest order placed");
                } catch (placeErr) {
                    logger.error(
                        { err: placeErr, userId: order.user_id, providerOrderId },
                        "Cashfree webhook: guest order placement FAILED after payment — needs manual fulfillment"
                    );
                }
            }

            return res.status(200).json({ received: true });
        } catch (err) {
            logger.error({ err, providerOrderId }, "Cashfree webhook: processing error");
            return res.status(500).json({ error: "Processing failed" });
        }
    }
);

export default webhookRouter;