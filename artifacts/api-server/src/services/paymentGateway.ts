/**
 * Multi-gateway payment service.
 *
 * Supports Cashfree and PayU (Razorpay stays in its own route file). Each
 * provider implements the same shape: createOrder, fetchPaymentStatus, and
 * a verifySignature helper where applicable.
 *
 * API keys/secrets are read from environment variables — NEVER from the
 * database. The `payment_settings` table only stores enable flags + ordering.
 *
 * Env vars expected:
 *   Cashfree: CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_ENV (sandbox|prod)
 *   PayU:     PAYU_MERCHANT_KEY, PAYU_MERCHANT_SALT, PAYU_ENV (test|live)
 */

import crypto from "crypto";
import { logger } from "../lib/logger";

// ── Types ───────────────────────────────────────────────────────────────────

export type ProviderKey = "razorpay" | "cashfree" | "payu";

export interface CreateOrderInput {
  amountINR: number;
  customerId: string;
  customerEmail: string;
  customerPhone?: string;
  orderId: string; // our internal payment_orders.id
  flow?: 'wallet_topup' | 'public_order';
  returnTo?: string;
}

export interface CreateOrderResult {
  provider: ProviderKey;
  providerOrderId: string;
  // Cashfree: session id for the SDK. PayU: not used (redirect flow).
  sessionId?: string;
  // PayU: the hash + redirect URL for the browser form POST.
  redirectUrl?: string;
  redirectParams?: Record<string, string>;
}

export interface PaymentStatusResult {
  status: "paid" | "pending" | "failed";
  providerPaymentId?: string;
  amountINR?: number;
  raw?: unknown;
}

export interface PaymentSettings {
  razorpay_enabled: boolean;
  cashfree_enabled: boolean;
  payu_enabled: boolean;
  gateway_priority: string[];
  min_topup_inr: number;
}

// ── Cashfree ────────────────────────────────────────────────────────────────

const CASHFREE_BASE =
  process.env.CASHFREE_ENV === "prod"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

const CASHFREE_API_VERSION = "2025-01-01";

function cashfreeCreds() {
  const appId = process.env.CASHFREE_APP_ID;
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!appId || !secret) return null;
  return { appId, secret };
}

async function cashfreeCreateOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  const creds = cashfreeCreds();
  if (!creds) throw new Error("Cashfree credentials not configured");

  // Build return URL with flow metadata
  const flow = input.flow || 'wallet_topup';
  const params = new URLSearchParams({ order_id: input.orderId, flow });
  if (input.returnTo) params.set('returnTo', input.returnTo);
  const returnUrl = `${process.env.FRONTEND_URL || ""}/payment/return?${params.toString()}`;

  const res = await fetch(`${CASHFREE_BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-version": CASHFREE_API_VERSION,
      "x-client-id": creds.appId,
      "x-client-secret": creds.secret,
    },
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: input.amountINR,
      order_currency: "INR",
      customer_details: {
        customer_id: input.customerId,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone || "9999999999",
      },
      order_meta: {
        return_url: returnUrl,
      },
    }),
  });

  const body = (await res.json()) as {
    order_id?: string;
    payment_session_id?: string;
    message?: string;
  };
  if (!res.ok) {
    logger.error({ body }, "Cashfree create-order failed");
    throw new Error(
      `Cashfree create-order failed: ${body.message || res.statusText}`
    );
  }

  return {
    provider: "cashfree",
    providerOrderId: body.order_id || input.orderId,
    sessionId: body.payment_session_id,
    redirectUrl: returnUrl
  };
}

async function cashfreeFetchStatus(
  providerOrderId: string
): Promise<PaymentStatusResult> {
  const creds = cashfreeCreds();
  if (!creds) throw new Error("Cashfree credentials not configured");

  // Fetch payments for the order.
  const res = await fetch(
    `${CASHFREE_BASE}/orders/${providerOrderId}/payments`,
    {
      headers: {
        "x-api-version": CASHFREE_API_VERSION,
        "x-client-id": creds.appId,
        "x-client-secret": creds.secret,
      },
    }
  );

  const body = (await res.json()) as unknown;
  if (!res.ok) {
    logger.error({ body }, "Cashfree fetch-status failed");
    return { status: "failed" };
  }

  // body is an array of payment attempts; find the successful one.
  const payments: Array<{
    payment_status: string;
    cf_payment_id: string;
    order_amount: number;
  }> = Array.isArray(body) ? (body as never) : [];

  const paid = payments.find((p) => p.payment_status === "SUCCESS");
  if (paid) {
    return {
      status: "paid",
      providerPaymentId: String(paid.cf_payment_id),
      amountINR: Number(paid.order_amount),
      raw: body,
    };
  }

  const anyPending = payments.some((p) =>
    ["PENDING", "NOT_STARTED", "ACTIVE"].includes(p.payment_status)
  );
  return { status: anyPending ? "pending" : "failed", raw: body };
}

// ── PayU ────────────────────────────────────────────────────────────────────

const PAYU_BASE =
  process.env.PAYU_ENV === "live"
    ? "https://secure.payu.in"
    : "https://test.payu.in";

function payuCreds() {
  const key = process.env.PAYU_MERCHANT_KEY;
  const salt = process.env.PAYU_MERCHANT_SALT;
  if (!key || !salt) return null;
  return { key, salt };
}

function payuHash(key: string, salt: string, parts: string[]): string {
  return crypto
    .createHash("sha512")
    .update(parts.join("|"))
    .digest("hex");
}

async function payuCreateOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  const creds = payuCreds();
  if (!creds) throw new Error("PayU credentials not configured");

  const txnid = input.orderId;
  const amount = input.amountINR.toFixed(2);
  const productinfo = "Wallet Top-up";
  const firstname = input.customerEmail.split("@")[0] || "User";
  const email = input.customerEmail;

  // Build return URL with flow metadata
  const flow = input.flow || 'wallet_topup';
  const params = new URLSearchParams({ order_id: txnid, provider: 'payu', flow });
  if (input.returnTo) params.set('returnTo', input.returnTo);
  const returnUrl = `${process.env.FRONTEND_URL || ""}/payment/return?${params.toString()}`;

  // PayU hash sequence for the request:
  // key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
  const hashString = [
    creds.key, txnid, amount, productinfo, firstname, email,
    "", "", "", "", "", "", "", "", "", creds.salt,
  ].join("|");
  const hash = payuHash(creds.key, creds.salt, hashString.split("|"));

  const paramsForm: Record<string, string> = {
    key: creds.key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    hash,
    surl: returnUrl,
    furl: returnUrl,
  };

  return {
    provider: "payu",
    providerOrderId: txnid,
    redirectUrl: `${PAYU_BASE}/_payment`,
    redirectParams: paramsForm,
  };
}

async function payuFetchStatus(
  providerOrderId: string
): Promise<PaymentStatusResult> {
  const creds = payuCreds();
  if (!creds) throw new Error("PayU credentials not configured");

  // verify_payment hash: sha512(key|command|var1|salt)
  const hash = payuHash(creds.key, creds.salt, [
    creds.key, "verify_payment", providerOrderId, creds.salt,
  ]);

  const form = new URLSearchParams({
    key: creds.key,
    command: "verify_payment",
    var1: providerOrderId,
    hash,
  });

  const res = await fetch(`${PAYU_BASE}/merchant/postservice?form=2`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const body = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    logger.error({ body }, "PayU verify_payment failed");
    return { status: "failed" };
  }

  // PayU returns { txnid: { status, mihpayid, amount, ... } }
  const tx = body[providerOrderId] as
    | { status?: string; mihpayid?: string; amount?: string | number }
    | undefined;
  if (!tx) return { status: "pending" };

  const status = String(tx.status || "").toLowerCase();
  if (status === "success" || status === "captured") {
    return {
      status: "paid",
      providerPaymentId: String(tx.mihpayid || ""),
      amountINR: Number(tx.amount || 0),
      raw: body,
    };
  }
  if (status === "pending" || status === "in progress") {
    return { status: "pending", raw: body };
  }
  return { status: "failed", raw: body };
}

// ── Unified API ─────────────────────────────────────────────────────────────

export async function createOrder(
  provider: ProviderKey,
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  switch (provider) {
    case "razorpay":
      return razorpayCreateOrder(input);
    case "cashfree":
      return cashfreeCreateOrder(input);
    case "payu":
      return payuCreateOrder(input);
    default:
      throw new Error(`Provider ${provider} not supported here`);
  }
}
async function razorpayCreateOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  const keyId = process.env.RAZORPAY_KEY_ID!;
  const keySecret = process.env.RAZORPAY_KEY_SECRET!;

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
    },
    body: JSON.stringify({
      amount: Math.round(input.amountINR * 100), // paise
      currency: "INR",
      receipt: input.orderId,
    }),
  });

  const body = (await res.json()) as { id?: string; error?: { description: string } };
  if (!res.ok) {
    throw new Error(`Razorpay create-order failed: ${body.error?.description || res.statusText}`);
  }

  return {
    provider: "razorpay",
    providerOrderId: body.id!,
  };
}
export async function fetchPaymentStatus(
  provider: ProviderKey,
  providerOrderId: string
): Promise<PaymentStatusResult> {
  switch (provider) {
    case "cashfree":
      return cashfreeFetchStatus(providerOrderId);
    case "payu":
      return payuFetchStatus(providerOrderId);
    default:
      throw new Error(`Provider ${provider} not supported here`);
  }
}

export function isProviderConfigured(provider: ProviderKey): boolean {
  switch (provider) {
    case "cashfree":
      return !!cashfreeCreds();
    case "payu":
      return !!payuCreds();
    case "razorpay":
      return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
    default:
      return false;
  }
}

/**
 * Returns the ordered list of providers that are both enabled in settings
 * AND have credentials configured. Used by the create-order route to pick
 * the primary provider and by the fallback loop to pick the next one.
 */
export function resolveActiveProviders(
  settings: PaymentSettings
): ProviderKey[] {
  const enabled: ProviderKey[] = [];
  for (const p of settings.gateway_priority) {
    if (p === "cashfree" && settings.cashfree_enabled && isProviderConfigured("cashfree"))
      enabled.push("cashfree");
    if (p === "payu" && settings.payu_enabled && isProviderConfigured("payu"))
      enabled.push("payu");
    if (p === "razorpay" && settings.razorpay_enabled && isProviderConfigured("razorpay"))
      enabled.push("razorpay");
  }
  return enabled;
}
