import { supabaseAdmin } from "./supabaseAdmin";

export interface ServicePricing {
    providerRateUsd: number;
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
}

export async function calculatePricing(
    providerRateUsd: number,
    quantity: number,
    walletCurrency: string
): Promise<ServicePricing> {
    const [settingsResult, rateResult] = await Promise.all([
        supabaseAdmin
            .from("platform_settings")
            .select("markup_percent, cashfree_fee_percent")
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
    const markup = markupPercent / 100;
    const cashfreeFee = cashfreeFeePercent / 100;
    const usdToInr = Number(rateResult.data?.rate ?? 84);

    // Per 1000 units
    const providerRateInr = providerRateUsd * usdToInr;
    const afterMarkup = providerRateInr * (1 + markup);
    const sellRateInr = afterMarkup * (1 + cashfreeFee);

    // For actual quantity
    const providerCostInr = (providerRateInr * quantity) / 1000;
    const providerCostUsd = (providerRateUsd * quantity) / 1000;
    const userChargedInr = (sellRateInr * quantity) / 1000;
    const afterMarkupAmount = (afterMarkup * quantity) / 1000;
    const marginInr = afterMarkupAmount - providerCostInr;
    const cashfreeFeeInr = userChargedInr - afterMarkupAmount;

    const userChargedAmount =
        walletCurrency === "INR" ? userChargedInr : userChargedInr / usdToInr;

    return {
        providerRateUsd,
        providerRateInr: round(providerRateInr),
        usdToInr,
        sellRateInr: round(sellRateInr),
        providerCostInr: round(providerCostInr),
        providerCostUsd: round(providerCostUsd),
        userChargedInr: round(userChargedInr),
        marginInr: round(marginInr),
        cashfreeFeeInr: round(cashfreeFeeInr),
        userChargedAmount: round(userChargedAmount),
        userChargedCurrency: walletCurrency,
        markupPercent,
        cashfreeFeePercent,
    };
}

function round(n: number, decimals = 4): number {
    return Number(n.toFixed(decimals));
}