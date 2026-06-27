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
 * Resolves the wallet's locked currency. If the wallet already has a
 * non-default currency set, that is the source of truth. If the wallet
 * currency is still the default ('USD') and this is the first top-up,
 * we lock it to the user's preferred_currency from user_settings.
 *
 * Returns the currency code that should be used for crediting.
 */
async function resolveWalletCurrency(
    userId: string,
    walletId: string,
    walletCurrency: string | null
): Promise<string> {
    // If wallet already has a non-USD currency locked, use it.
    if (walletCurrency && walletCurrency !== "USD") {
        return walletCurrency;
    }

    // First top-up: lock to user's preferred_currency, defaulting to INR
    // since all current gateways are INR-based.
    const { data: settings } = await supabaseAdmin
        .from("user_settings")
        .select("preferred_currency")
        .eq("user_id", userId)
        .maybeSingle();

    const preferred = settings?.preferred_currency || "INR";

    // Lock the wallet currency now.
    await supabaseAdmin
        .from("wallets")
        .update({ currency: preferred, updated_at: new Date().toISOString() })
        .eq("id", walletId);

    return preferred;
}

/**
 * Converts an amount from one currency to another using the exchange_rates
 * table. Includes a sanity-bounds check on the rate.
 */
async function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    // We only support INR↔USD conversion today.
    if (fromCurrency === "INR" && toCurrency === "USD") {
        const rate = await getINRtoUSDRate();
        // Sanity check: INR rate should be between 70 and 100.
        if (rate < 70 || rate > 100) {
            logger.warn({ rate }, "INR rate outside expected bounds — using fallback 83.5");
            return parseFloat((amount / 83.5).toFixed(4));
        }
        return parseFloat((amount / rate).toFixed(4));
    }

    if (fromCurrency === "USD" && toCurrency === "INR") {
        const rate = await getINRtoUSDRate();
        if (rate < 70 || rate > 100) {
            logger.warn({ rate }, "INR rate outside expected bounds — using fallback 83.5");
            return parseFloat((amount * 83.5).toFixed(4));
        }
        return parseFloat((amount * rate).toFixed(4));
    }

    throw new Error(`Unsupported currency conversion: ${fromCurrency} → ${toCurrency}`);
}

/**
 * Credits the wallet for a verified payment. Uses the same insert-first
 * idempotency pattern as the Razorpay verify route: the unique constraint
 * on wallet_transactions.reference_id prevents double-credit.
 *
 * The amount is credited in the wallet's locked currency. If the gateway
 * payment currency matches the wallet currency, no FX conversion happens.
 * If they differ, FX conversion is applied with a sanity-bounds check.
 */
export async function creditWallet(
    userId: string,
    paymentAmount: number,
    paymentCurrency: string,
    provider: ProviderKey,
    providerPaymentId: string
): Promise<{ newBalance: number; duplicate: boolean; currency: string }> {
    const { data: wallet, error: walletErr } = await supabaseAdmin
        .from("wallets")
        .select("id, balance, currency")
        .eq("user_id", userId)
        .maybeSingle();

    if (walletErr || !wallet) throw new Error("Wallet not found");

    // Resolve the wallet's locked currency (or lock it now on first top-up).
    const walletCurrency = await resolveWalletCurrency(
        userId,
        wallet.id,
        wallet.currency
    );

    // Convert the payment amount to the wallet's currency if needed.
    // If gateway currency == wallet currency, no FX — exact amount credited.
    const creditAmount = await convertCurrency(
        paymentAmount,
        paymentCurrency,
        walletCurrency
    );

    const newBalance = Number(wallet.balance) + creditAmount;
    const referenceId = `${provider}_${providerPaymentId}`;

    const { error: txErr } = await supabaseAdmin.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        user_id: userId,
        type: "credit",
        amount: creditAmount,
        description: `Wallet top-up via ${provider} (${paymentCurrency} ${paymentAmount.toFixed(2)})`,
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
                newBalance: existing?.balance_after ?? Number(wallet.balance),
                duplicate: true,
                currency: walletCurrency,
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
            { userId, referenceId, creditAmount, updateErr },
            "CRITICAL: tx inserted but wallet update failed — manual reconciliation needed"
        );
    }

    return { newBalance, duplicate: false, currency: walletCurrency };
}
