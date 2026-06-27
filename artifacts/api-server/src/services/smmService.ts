import { logger } from "../lib/logger";
import { supabaseAdmin } from "../lib/supabaseAdmin";

const SMM_API_URL = "https://worldofsmm.com/api/v2";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

function getApiKey(): string {
  const key = process.env.WORLD_OF_SMM_API_KEY;
  if (!key) throw new Error("WORLD_OF_SMM_API_KEY is not set");
  return key;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function smmRequest<T>(
  data: Record<string, string | number | undefined>,
  attempt = 1
): Promise<T> {
  const formData = new URLSearchParams();
  formData.append("key", getApiKey());

  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined && v !== null && v !== "") {
      formData.append(k, String(v));
    }
  }

  let res: Response;
  try {
    res = await fetch(SMM_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      logger.warn({ attempt, err }, "SMM API network error, retrying");
      await sleep(RETRY_DELAY_MS * attempt);
      return smmRequest<T>(data, attempt + 1);
    }
    logger.error({ err }, "SMM API network error after retries");
    throw new Error("SMM provider unreachable");
  }

  if (!res.ok) {
    if (attempt < MAX_RETRIES && res.status >= 500) {
      logger.warn({ attempt, status: res.status }, "SMM API server error, retrying");
      await sleep(RETRY_DELAY_MS * attempt);
      return smmRequest<T>(data, attempt + 1);
    }
    throw new Error(`SMM API HTTP ${res.status}`);
  }

  const json = await res.json();

  if (json && typeof json === "object" && "error" in json && json.error) {
    logger.error({ error: json.error, action: data.action }, "SMM API returned error");
    throw new Error(String(json.error));
  }

  return json as T;
}

export interface SMMService {
  service: number;
  name: string;
  type: string;
  rate: string;
  min: string;
  max: string;
  category?: string;
  description?: string;
}

export interface BalanceResponse {
  balance: string;
  currency: string;
}

export interface CreateOrderParams {
  service: number;
  link: string;
  quantity?: number;
  runs?: number;
  interval?: number;
  comments?: string;
  usernames?: string;
  hashtags?: string;
  hashtag?: string;
  username?: string;
  media?: string;
  groups?: string;
  answer_number?: string;
  posts?: number;
  old_posts?: number;
  delay?: number;
  expiry?: string;
  min?: number;
  max?: number;
}

export interface OrderResponse {
  order: number | string;
}

export interface OrderStatus {
  order: number | string;
  status: string;
  charge: string;
  start_count?: string;
  remains?: string;
  currency?: string;
}

export async function fetchServices(): Promise<SMMService[]> {
  return smmRequest<SMMService[]>({ action: "services" });
}

/**
 * Syncs the WorldOfSMM service catalog to the local smm_services_cache table.
 * Converts provider rates to INR using the USD→INR exchange rate.
 * Returns the count of services synced.
 */
export async function syncServicesToCache(): Promise<{ count: number; error?: string }> {
  const services = await fetchServices();

  const { data: exchangeRateRow, error: rateErr } = await supabaseAdmin
    .from("exchange_rates")
    .select("rate")
    .eq("base_currency", "USD")
    .eq("target_currency", "INR")
    .maybeSingle();

  if (rateErr || !exchangeRateRow?.rate) {
    return { count: 0, error: "USD→INR exchange rate not configured" };
  }

  const usdToInr = Number(exchangeRateRow.rate);
  const now = new Date().toISOString();

  const rows = services.map((s) => ({
    service_id: s.service,
    name: s.name,
    type: s.type || null,
    category: s.category || null,
    description: s.description || null,
    provider_rate: s.rate,
    provider_rate_inr: parseFloat(s.rate) * usdToInr,
    min: s.min,
    max: s.max,
    last_synced_at: now,
  }));

  // Upsert all services (insert new, update existing)
  const { error: upsertErr } = await supabaseAdmin
    .from("smm_services_cache")
    .upsert(rows, { onConflict: "service_id" });

  if (upsertErr) {
    return { count: 0, error: upsertErr.message };
  }

  return { count: services.length };
}

/**
 * Gets the sell rate (INR per 1000 units) for a service, applying the global markup.
 * Returns null if the service is not found in cache.
 */
export async function getServiceSellRate(
  serviceId: number
): Promise<{ sellRateInr: number; providerRateInr: number; markupPercent: number } | null> {
  const [serviceResult, settingsResult] = await Promise.all([
    supabaseAdmin
      .from("smm_services_cache")
      .select("provider_rate_inr")
      .eq("service_id", serviceId)
      .maybeSingle(),
    supabaseAdmin
      .from("platform_settings")
      .select("markup_percent")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  if (serviceResult.error || !serviceResult.data?.provider_rate_inr) {
    return null;
  }

  const providerRateInr = Number(serviceResult.data.provider_rate_inr);
  const markupPercent = Number(settingsResult.data?.markup_percent ?? 20);
  const sellRateInr = providerRateInr * (1 + markupPercent / 100);

  return { sellRateInr, providerRateInr, markupPercent };
}

export async function fetchBalance(): Promise<BalanceResponse> {
  return smmRequest<BalanceResponse>({ action: "balance" });
}

export async function submitOrder(params: CreateOrderParams): Promise<OrderResponse> {
  const data: Record<string, string | number | undefined> = {
    action: "add",
    service: params.service,
    link: params.link,
  };
  if (params.quantity !== undefined) data.quantity = params.quantity;
  if (params.runs !== undefined) data.runs = params.runs;
  if (params.interval !== undefined) data.interval = params.interval;
  if (params.comments) data.comments = params.comments;
  if (params.usernames) data.usernames = params.usernames;
  if (params.hashtags) data.hashtags = params.hashtags;
  if (params.hashtag) data.hashtag = params.hashtag;
  if (params.username) data.username = params.username;
  if (params.media) data.media = params.media;
  if (params.groups) data.groups = params.groups;
  if (params.answer_number) data.answer_number = params.answer_number;
  if (params.posts !== undefined) data.posts = params.posts;
  if (params.old_posts !== undefined) data.old_posts = params.old_posts;
  if (params.delay !== undefined) data.delay = params.delay;
  if (params.expiry) data.expiry = params.expiry;
  if (params.min !== undefined) data.min = params.min;
  if (params.max !== undefined) data.max = params.max;

  return smmRequest<OrderResponse>(data);
}

export async function fetchOrderStatus(orderId: number | string): Promise<OrderStatus> {
  return smmRequest<OrderStatus>({ action: "status", order: orderId });
}

export async function cancelProviderOrder(
  orderId: number | string
): Promise<{ success: boolean }> {
  try {
    const result = await smmRequest<{ success?: boolean }>({
      action: "cancel",
      order: orderId,
    });
    return { success: result.success ?? true };
  } catch {
    return { success: false };
  }
}
