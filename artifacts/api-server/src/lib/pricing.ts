import { supabaseAdmin } from "./supabaseAdmin";

export const PLATFORM_MARKUP: Record<string, number> = {
    instagram: 1.4,
    youtube: 1.35,
    tiktok: 1.3,
    facebook: 1.25,
    twitter: 1.2,
    linkedin: 1.2,
    telegram: 1.0,
    snapchat: 1.15,
    pinterest: 1.1,
    threads: 1.15,
    spotify: 1.2,
    twitch: 1.15,
    default: 1.15,
};

export interface ServicePricing {
    providerRateInr: number;
    usdToInr: number;
    sellRateInr: number;
    providerCostInr: number;
    providerCostUsd: number;
    userChargedInr: number;
    marginInr: number;
    cashfreeFeeInr: number;
    userChargedAmount: number;
    userChargedCurrency: string;
    markupPercent: number;
    cashfreeFeePercent: number;
    fulfilmentQuantity: number;   // actual quantity sent to provider
    platformMultiplier: number;   // for audit
}

export async function calculatePricing(
    providerRateUsd: number,
    quantity: number,
    walletCurrency: string,
    platform?: string,
): Promise<ServicePricing> {
    const [settingsResult, rateResult] = await Promise.all([
        supabaseAdmin
            .from("platform_settings")
            .select("markup_percent, cashfree_fee_percent, quantity_factor, min_order_charge_inr")
            .eq("id", 1)
            .maybeSingle(),
        supabaseAdmin
            .from("exchange_rates")
            .select("rate")
            .eq("base_currency", "USD")
            .eq("target_currency", "INR")
            .maybeSingle(),
    ]);

    const markupPercent = Number(settingsResult.data?.markup_percent ?? 20);
    const cashfreeFeePercent = Number(settingsResult.data?.cashfree_fee_percent ?? 2);
    const quantityFactor = Number(settingsResult.data?.quantity_factor ?? 1.0);
    const minOrderChargeInr = Number(settingsResult.data?.min_order_charge_inr ?? 0);
    const markup = markupPercent / 100;
    const cashfreeFee = cashfreeFeePercent / 100;
    const usdToInr = Number(rateResult.data?.rate ?? 84);

    const platformKey = platform?.toLowerCase() ?? "default";
    const platformMultiplier = PLATFORM_MARKUP[platformKey] ?? PLATFORM_MARKUP["default"]!;
    const fulfilmentQuantity = Math.floor(quantity * quantityFactor);

    const providerRateInr = providerRateUsd * usdToInr;
    const afterMarkup = providerRateInr * (1 + markup);
    const sellRateInr = afterMarkup * (1 + cashfreeFee) * platformMultiplier;
    const rawUserChargedInr = (sellRateInr * quantity) / 1000;
    const userChargedInr = Math.max(rawUserChargedInr, minOrderChargeInr);
    const providerCostInr = (providerRateInr * fulfilmentQuantity) / 1000;
    const providerCostUsd = (providerRateUsd * fulfilmentQuantity) / 1000;
    const afterMarkupAmount = (afterMarkup * platformMultiplier * quantity) / 1000;
    const cashfreeFeeInr = afterMarkupAmount * cashfreeFee;
    const marginInr = userChargedInr - providerCostInr - cashfreeFeeInr;
    const userChargedAmount =
        walletCurrency === "INR" ? userChargedInr : userChargedInr / usdToInr;

    return {
        providerRateInr: round(providerRateInr),
        providerCostInr: round(providerCostInr),
        providerCostUsd: round(providerCostUsd),
        usdToInr,
        sellRateInr: round(sellRateInr),
        userChargedInr: round(userChargedInr),
        marginInr: round(marginInr),
        cashfreeFeeInr: round(cashfreeFeeInr),
        userChargedAmount: round(userChargedAmount),
        userChargedCurrency: walletCurrency,
        markupPercent,
        cashfreeFeePercent,
        fulfilmentQuantity,
        platformMultiplier,
    };
}

export function round(n: number, decimals = 4): number {
    return Number(n.toFixed(decimals));
}