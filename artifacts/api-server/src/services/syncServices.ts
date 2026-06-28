import { logger } from "../lib/logger";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { fetchServices } from "./smmService";

export async function syncSmmServices(): Promise<{ synced: number; error?: string }> {
    try {
        logger.info("Starting SMM services sync...");

        const [liveServices, rateResult] = await Promise.all([
            fetchServices(),
            supabaseAdmin
                .from("exchange_rates")
                .select("rate")
                .eq("base_currency", "USD")
                .eq("target_currency", "INR")
                .maybeSingle(),
        ]);

        if (!liveServices?.length) {
            logger.warn("Provider returned no services — aborting sync");
            return { synced: 0, error: "Provider returned empty services" };
        }

        const usdToInr = Number(rateResult.data?.rate ?? 84);
        logger.info({ usdToInr }, "Using USD→INR rate for sync");

        const rows = liveServices.map((s: any) => ({
            service_id: String(s.service),
            name: s.name,
            type: s.type ?? null,
            category: s.category ?? null,
            description: s.description ?? null,
            provider_rate: s.rate,
            provider_rate_inr: (parseFloat(s.rate) * usdToInr).toFixed(6),
            min: s.min ?? 10,
            max: s.max ?? 100000,
            last_synced_at: new Date().toISOString(),
        }));

        const { error } = await supabaseAdmin
            .from("smm_services_cache")
            .upsert(rows, { onConflict: "service_id" });

        if (error) {
            logger.error({ error }, "Supabase upsert failed during SMM sync");
            return { synced: 0, error: error.message };
        }

        logger.info({ count: rows.length }, "SMM services sync complete");
        return { synced: rows.length };
    } catch (err) {
        logger.error({ err }, "SMM services sync failed");
        return { synced: 0, error: String(err) };
    }
}
const EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/USD";

interface ExchangeRateRow {
    base_currency: string;
    target_currency: string;
    rate: number;
    source: string;
    updated_at: string;
}

interface SyncResult {
    synced: number;
    error?: string;
}

interface ExchangeRateApiResponse {
    provider: string;
    base: string;
    date: string;
    time_last_updated: number;
    rates: Record<string, number>;
}

export async function syncExchangeRates(): Promise<SyncResult> {
    try {
        logger.info("Starting exchange rate sync...");

        const res = await fetch(EXCHANGE_API_URL);
        if (!res.ok) throw new Error(`Exchange API returned ${res.status}`);

        const data = (await res.json()) as ExchangeRateApiResponse;

        if (!data.rates || typeof data.rates !== "object" || !("USD" in data.rates)) {
            throw new Error("Invalid response from exchange rate API");
        }

        const now = new Date().toISOString();

        const rows: ExchangeRateRow[] = Object.entries(data.rates).map(
            ([currency, rate]): ExchangeRateRow => ({
                base_currency: "USD",
                target_currency: currency,
                rate: Number(rate),
                source: "api",
                updated_at: now,
            })
        );

        const BATCH_SIZE = 100;
        let totalSynced = 0;

        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const batch = rows.slice(i, i + BATCH_SIZE);

            const { error } = await supabaseAdmin
                .from("exchange_rates")
                .upsert(batch, { onConflict: "base_currency,target_currency" });

            if (error) {
                logger.error({ error, batchIndex: i, batchSize: batch.length }, "Supabase upsert failed during rate sync");
                return { synced: totalSynced, error: error.message };
            }

            totalSynced += batch.length;
            logger.info({ batchIndex: i, batchSynced: batch.length, totalSynced }, "Batch synced");
        }

        logger.info({ totalSynced, date: data.date, lastUpdated: data.time_last_updated }, "Exchange rates sync complete");
        return { synced: totalSynced };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error({ err, message }, "Exchange rate sync failed");
        return { synced: 0, error: message };
    }
}

