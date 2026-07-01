// src/routes/guestCheckout.ts
import { z } from "zod";
import crypto from "crypto";
import { Router } from "express";
import { computeSellRateInr, PLATFORM_MARKUP } from "../lib/pricing";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { logger } from "../lib/logger";
import { generalLimiter } from "./smm";
import {
    createOrder as gatewayCreateOrder,
    resolveActiveProviders,
    type PaymentSettings,
} from "../services/paymentGateway";

const router = Router();

const GuestCheckoutSchema = z.object({
    serviceId: z.string().min(1),
    serviceName: z.string().min(1),
    platform: z.string().min(1),
    link: z.string().url(),
    quantity: z.number().int().positive(),
    email: z.string().email(),
});

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

router.post("/checkout", generalLimiter, async (req, res) => {
    const parsed = GuestCheckoutSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid order details" });
    }
    const { serviceId, serviceName, platform, link, quantity, email } = parsed.data;

    // ── 1. Recompute price server-side ─────────────────────────────────────
    const [serviceResult, settingsResult, rateResult] = await Promise.all([
        supabaseAdmin.from("smm_services_cache").select("*").eq("service_id", serviceId).maybeSingle(),
        supabaseAdmin.from("platform_settings").select("markup_percent, cashfree_fee_percent").eq("id", 1).maybeSingle(),
        supabaseAdmin.from("exchange_rates").select("rate").eq("base_currency", "USD").eq("target_currency", "INR").maybeSingle(),
    ]);

    const service = serviceResult.data;
    if (!service) return res.status(404).json({ error: "Service not found" });
    if (quantity < service.min || quantity > service.max) {
        return res.status(400).json({ error: `Quantity must be between ${service.min} and ${service.max}` });
    }

    const markupPercent = Number(settingsResult.data?.markup_percent ?? 20);
    const cashfreeFeePercent = Number(settingsResult.data?.cashfree_fee_percent ?? 2);
    const usdToInr = Number(rateResult.data?.rate ?? 94.44);
    const platformKey = platform.toLowerCase();
    const platformMultiplier = PLATFORM_MARKUP[platformKey] ?? PLATFORM_MARKUP["default"]!;

    const ratePerThousand = computeSellRateInr({
        providerRateUsd: Number(service.provider_rate),
        markupPercent, cashfreeFeePercent, usdToInr, platformMultiplier,
    });
    const priceINR = Number(((ratePerThousand * quantity) / 1000).toFixed(2));

    // ── 2. Find or create the user by email ──────────────────────────────────
    const normalizedEmail = email.trim().toLowerCase();
    let userId: string;
    let isExistingAccount = false;
    const { data: userListData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();

    if (listErr) {
        logger.error({ err: listErr }, "Failed to look up existing user by email");
        return res.status(500).json({ error: "Could not start checkout" });
    }

    const found = userListData.users.find((u) => u.email?.toLowerCase() === normalizedEmail);

    if (found) {
        userId = found.id;
        isExistingAccount = true;
    } else {
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email: normalizedEmail,
            email_confirm: true,
            user_metadata: { created_via: "guest_checkout" },
        });
        if (createErr || !created.user) {
            logger.error({ err: createErr, email: normalizedEmail }, "Failed to create guest account");
            return res.status(500).json({ error: "Could not start checkout" });
        }
        userId = created.user.id;

        await supabaseAdmin.from("wallets").insert({ user_id: userId, balance: 0, currency: "INR" });
    }

    // ── 3. Create the payment order using the SAME multi-gateway logic as
    //       the authenticated top-up flow — same fallback, same shape ───────
    try {
        const settings = await getPaymentSettings();
        const active = resolveActiveProviders(settings);
        if (active.length === 0) {
            return res.status(503).json({ error: "No payment gateway is currently active" });
        }

        let lastError: string | undefined;

        for (const provider of active) {
            const orderId = crypto.randomUUID();

            const { error: insertErr } = await supabaseAdmin.from("payment_orders").insert({
                id: orderId,
                user_id: userId,
                provider,
                amount_inr: priceINR,
                status: "pending",
                purpose: "guest_order",
                metadata: { serviceId, serviceName, platform, link, quantity, isExistingAccount },
                expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            });

            if (insertErr) {
                logger.error({ insertErr, userId, provider }, "Failed to insert payment_orders for guest checkout");
                lastError = "Failed to create order record";
                continue;
            }

            try {
                const result = await gatewayCreateOrder(provider, {
                    amountINR: priceINR,
                    customerId: userId,
                    customerEmail: normalizedEmail,
                    orderId,
                    flow: "guest_order",
                    returnTo: "/orders",
                });

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
                    amountINR: priceINR,
                    isExistingAccount,
                });
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "Gateway error";
                logger.warn({ provider, msg, userId }, "Guest checkout: provider create-order failed, trying fallback");
                lastError = msg;

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
        logger.error({ err, userId }, "Guest checkout: create-order error");
        return res.status(500).json({ error: "Failed to create payment order" });
    }
});

export default router;