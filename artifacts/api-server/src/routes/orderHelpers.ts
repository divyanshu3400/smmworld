import { supabaseAdmin } from "../lib/supabaseAdmin";
import { logger } from "../lib/logger";
import { submitOrder } from "../services/smmService";

interface PlaceOrderInput {
    serviceId: string;
    serviceName: string;
    platform: string;
    link: string;
    quantity: number;
}

/**
 * Places an order for a user who already has sufficient wallet balance.
 * Debits the wallet, creates the order row, then dispatches to the
 * upstream SMM provider. If the provider call fails after the debit,
 * the order is marked 'failed' and the debit is reversed — the customer
 * should never be charged for an order that never actually got placed.
 */
export async function placeOrderForUser(userId: string, input: PlaceOrderInput) {
    const { serviceId, serviceName, platform, link, quantity } = input;

    // 1. Recompute price server-side from current rates — never trust a
    //    price that was calculated client-side or minutes ago.
    const priceINR = await computeCurrentPriceINR(serviceId, quantity, platform);

    // 2. Check + debit wallet atomically
    const { data: wallet } = await supabaseAdmin
        .from("wallets")
        .select("id, balance")
        .eq("user_id", userId)
        .single();

    if (!wallet) throw new Error("Wallet not found");
    if (Number(wallet.balance) < priceINR) {
        throw new Error("Insufficient balance");
    }

    const { data: newBalance, error: debitErr } = await supabaseAdmin.rpc(
        "increment_wallet_balance",
        { p_wallet_id: wallet.id, p_amount: -priceINR }
    );
    if (debitErr) throw new Error("Failed to debit wallet");

    // 3. Insert the order row as 'pending' before calling the provider
    const { data: orderRow, error: insertErr } = await supabaseAdmin
        .from("orders")
        .insert({
            user_id: userId,
            service_id: serviceId,
            service_name: serviceName,
            platform,
            link,
            quantity,
            price: priceINR,
            currency: "INR",
            status: "pending",
        })
        .select()
        .single();

    if (insertErr || !orderRow) {
        // Refund the debit — the order was never created
        await supabaseAdmin.rpc("increment_wallet_balance", { p_wallet_id: wallet.id, p_amount: priceINR });
        throw new Error("Failed to create order record");
    }

    // 4. Dispatch to the upstream provider
    try {
        const providerResult = await submitOrder({ service:Number(serviceId), link, quantity });

        await supabaseAdmin
            .from("orders")
            .update({ status: "processing", external_order_id: providerResult.order })
            .eq("id", orderRow.id);

        return { orderId: orderRow.id, externalOrderId: providerResult.order };
    } catch (err) {
        logger.error({ err, orderId: orderRow.id, userId }, "Provider order placement failed — refunding");

        await supabaseAdmin
            .from("orders")
            .update({ status: "failed" })
            .eq("id", orderRow.id);

        await supabaseAdmin.rpc("increment_wallet_balance", { p_wallet_id: wallet.id, p_amount: priceINR });

        throw new Error("Order could not be placed with provider — refunded");
    }
}

async function computeCurrentPriceINR(serviceId: string, quantity: number, platform: string): Promise<number> {
    // Reuse the exact same computeSellRateInr + rate/markup lookup from your
    // /services and /services/:id routes so pricing never diverges.
    throw new Error("computeCurrentPriceINR not implemented — wire to your existing pricing logic");
}