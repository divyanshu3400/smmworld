import { supabaseAdmin } from "./supabaseAdmin";

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
    fulfilmentQuantity: number;
}

/**
 * Calculate pricing for an SMM order.
 *
 * Formula (MUST match services list exactly):
 *   sellRateInr = providerRateUsd × usdToInr × (1 + markupPercent/100) × (1 + cashfreeFeePercent/100)
 *   userChargedInr = (sellRateInr × quantity) / 1000
 *
 * @param providerRateUsd - Provider rate per 1000 units in USD (from smm_services_cache.provider_rate)
 * @param quantity - Number of units to order
 * @param walletCurrency - User's wallet currency
 */
export async function calculatePricing(
    providerRateUsd: number,
    quantity: number,
    walletCurrency: string,
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

    const fulfilmentQuantity = Math.floor(quantity * quantityFactor);

    // Step 1: Convert USD rate to INR
    const providerRateInr = providerRateUsd * usdToInr;

    // Step 2: Apply markup and cashfree fee (EXACT same formula as services list)
    const sellRateInr = providerRateInr * (1 + markup) * (1 + cashfreeFee);

    // Step 3: Calculate user charge
    const rawUserChargedInr = (sellRateInr * quantity) / 1000;
    const userChargedInr = Math.max(rawUserChargedInr, minOrderChargeInr);

    // Provider cost based on actual fulfilment quantity
    const providerCostInr = (providerRateInr * fulfilmentQuantity) / 1000;
    const providerCostUsd = (providerRateUsd * fulfilmentQuantity) / 1000;

    // Fee breakdown (for margin calculation)
    const afterMarkupAmount = (providerRateInr * (1 + markup) * quantity) / 1000;
    const cashfreeFeeInr = afterMarkupAmount * cashfreeFee;
    const marginInr = userChargedInr - providerCostInr - cashfreeFeeInr;

    // Convert to wallet currency if needed
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
    };
}

function round(n: number, decimals = 4): number {
    return Number(n.toFixed(decimals));
}