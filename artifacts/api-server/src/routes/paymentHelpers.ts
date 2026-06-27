import { logger } from "../lib/logger";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import type { ProviderKey } from "../services/paymentGateway";
import Razorpay from "razorpay";


export function getRazorpay() {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) throw new Error("Razorpay keys not configured");
    return new Razorpay({ key_id, key_secret });
}

export async function getINRtoUSD(): Promise<number> {
    const { data } = await supabaseAdmin
        .from("exchange_rates")
        .select("rate")
        .eq("target_currency", "INR")
        .single();
    return data?.rate || 83.5;
}


export async function getINRtoUSDRate(): Promise<number> {
    const { data } = await supabaseAdmin
        .from("exchange_rates")
        .select("rate")
        .eq("target_currency", "INR")
        .maybeSingle();
    return data?.rate || 83.5;
}

/**
 * Credits the wallet for a verified payment. Uses the same insert-first
 * idempotency pattern as the Razorpay verify route: the unique constraint
 * on wallet_transactions.reference_id prevents double-credit.
 */
export async function creditWallet(
    userId: string,
    amountUSD: number,
    amountINR: number,
    provider: ProviderKey,
    providerPaymentId: string
): Promise<{ newBalance: number; duplicate: boolean }> {
    const { data: wallet, error: walletErr } = await supabaseAdmin
        .from("wallets")
        .select("id, balance")
        .eq("user_id", userId)
        .maybeSingle();

    if (walletErr || !wallet) throw new Error("Wallet not found");

    const newBalance = wallet.balance + amountUSD;
    const referenceId = `${provider}_${providerPaymentId}`;

    const { error: txErr } = await supabaseAdmin.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        user_id: userId,
        type: "credit",
        amount: amountUSD,
        description: `Wallet top-up via ${provider} (₹${amountINR.toFixed(2)})`,
        reference_id: referenceId,
        balance_after: newBalance,
    });

    if (txErr) {
        if (txErr.code === "23505") {
            // Duplicate — already credited. Return existing balance.
            const { data: existing } = await supabaseAdmin
                .from("wallet_transactions")
                .select("amount, balance_after")
                .eq("reference_id", referenceId)
                .eq("user_id", userId)
                .eq("type", "credit")
                .maybeSingle();
            return {
                newBalance: existing?.balance_after ?? wallet.balance,
                duplicate: true,
            };
        }
        throw txErr;
    }

    const { error: updateErr } = await supabaseAdmin
        .from("wallets")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("id", wallet.id);

    if (updateErr) {
        logger.error(
            { userId, referenceId, amountUSD, updateErr },
            "CRITICAL: tx inserted but wallet update failed — manual reconciliation needed"
        );
    }

    return { newBalance, duplicate: false };
}
