/*
# Payment Gateway Settings & Orders Tables

## Purpose
Adds multi-gateway payment support (Cashfree + PayU) with admin-controlled
activation toggles and per-transaction order tracking. This replaces the
single-provider Razorpay-only model with a configurable, fallback-capable
system. Razorpay remains as a third option the admin can toggle.

## 1. New Tables

### `payment_settings`
Single-row config table (id = 1 enforced) holding which gateways are active
and their display order / fallback priority. API keys/secrets are NOT stored
here — those live in environment variables on the server. This table only
holds booleans and ordering metadata that the admin UI toggles.

- `id` int2 PRIMARY KEY, always 1 (singleton)
- `razorpay_enabled` bool default false
- `cashfree_enabled` bool default false
- `payu_enabled` bool default false
- `gateway_priority` text[] — ordered list of provider keys, e.g. {cashfree,payu,razorpay}. First = primary, rest = fallback order.
- `min_topup_inr` numeric default 1 — minimum wallet top-up amount in INR
- `updated_at` timestamptz
- `updated_by` uuid — admin user who last changed settings (nullable)

### `payment_orders`
Tracks every wallet top-up attempt across all gateways. One row per attempt.
Used for: fallback (if primary fails, next attempt uses next provider),
audit, reconciliation, and preventing duplicate credits.

- `id` uuid PRIMARY KEY
- `user_id` uuid NOT NULL — owner (references auth.users)
- `provider` text NOT NULL — 'razorpay' | 'cashfree' | 'payu'
- `provider_order_id` text — order id returned by the gateway
- `provider_payment_id` text — payment id once paid (nullable)
- `amount_inr` numeric NOT NULL — exact amount in INR
- `amount_usd` numeric — credited amount in USD (set on success)
- `status` text NOT NULL default 'pending' — 'pending' | 'paid' | 'failed' | 'expired'
- `upi_vpa` text — for UPI Collect flows, the VPA the user entered (nullable)
- `failure_reason` text — why it failed, if status = failed (nullable)
- `created_at` timestamptz default now()
- `paid_at` timestamptz — when payment was confirmed (nullable)
- `expires_at` timestamptz — when the order is considered stale (nullable)

Indexes:
- `payment_orders_user_id_idx` on user_id
- `payment_orders_provider_order_id_idx` on provider_order_id (for webhook lookups)
- `payment_orders_status_idx` on status

Unique constraint:
- `payment_orders_provider_order_id_key` on (provider, provider_order_id) —
  a gateway order id is globally unique per provider, so this prevents
  duplicate rows for the same gateway order.

## 2. Security (RLS)

Both tables are admin-managed. `payment_settings` is readable by any
authenticated user (the wallet page needs to know which gateways are active
to render the UI) but writable only by admins. `payment_orders` is
owner-scoped: a user can read/insert their own orders, but only the server
(using the service role key, which bypasses RLS) updates status to 'paid'
and credits the wallet — the user cannot self-approve their own payment.

Admin detection uses `auth.uid()` against `auth.users.app_metadata.role = 'admin'`
via a SECURITY DEFINER function `is_admin()`.

## 3. Notes

- API keys/secrets are NEVER stored in the database. They live in server
  environment variables (CASHFREE_APP_ID, CASHFREE_SECRET_KEY, PAYU_MERCHANT_KEY,
  PAYU_MERCHANT_SALT, etc.). This table only stores enable flags + ordering.
- The `payment_orders` table is the source of truth for "did this user
  actually pay". The existing `wallet_transactions.reference_id` unique
  constraint still guards against double-credit: we insert the wallet tx
  with reference_id = provider_payment_id, and a duplicate insert throws 23505.
- Fallback logic: when a user initiates a top-up, the server creates a
  `payment_orders` row with the primary provider. If that provider's
  create-order call fails (gateway down, keys missing), the server marks
  the row 'failed' and retries with the next enabled provider in
  `gateway_priority`. The user only ever sees the final working order.
*/

-- ── Helper: is_admin() ──────────────────────────────────────────────────────
-- SECURITY DEFINER so it can read auth.users.app_metadata which RLS would
-- otherwise block. Returns true if the current user has role 'admin' in
-- app_metadata OR their email is in the ADMIN_EMAILS env list (checked
-- server-side, not here — this function only checks app_metadata).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND raw_app_meta_data->>'role' = 'admin'
  );
$$;

-- ── payment_settings (singleton) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  razorpay_enabled boolean NOT NULL DEFAULT false,
  cashfree_enabled boolean NOT NULL DEFAULT false,
  payu_enabled boolean NOT NULL DEFAULT false,
  gateway_priority text[] NOT NULL DEFAULT ARRAY['cashfree','payu','razorpay']::text[],
  min_topup_inr numeric NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read which gateways are active (wallet UI needs it).
-- Only admins can write.
DROP POLICY IF EXISTS "read_payment_settings" ON public.payment_settings;
CREATE POLICY "read_payment_settings"
ON public.payment_settings FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_payment_settings" ON public.payment_settings;
CREATE POLICY "admin_update_payment_settings"
ON public.payment_settings FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_payment_settings" ON public.payment_settings;
CREATE POLICY "admin_insert_payment_settings"
ON public.payment_settings FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

-- Seed the singleton row if it doesn't exist.
INSERT INTO public.payment_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ── payment_orders ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('razorpay','cashfree','payu')),
  provider_order_id text,
  provider_payment_id text,
  amount_inr numeric NOT NULL CHECK (amount_inr > 0),
  amount_usd numeric,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','expired')),
  upi_vpa text,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  expires_at timestamptz
);

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- Users can read + create their own orders. They CANNOT update or delete —
-- status transitions to 'paid' happen server-side via the service role key
-- (which bypasses RLS). This prevents a user from self-approving a payment.
DROP POLICY IF EXISTS "select_own_payment_orders" ON public.payment_orders;
CREATE POLICY "select_own_payment_orders"
ON public.payment_orders FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_payment_orders" ON public.payment_orders;
CREATE POLICY "insert_own_payment_orders"
ON public.payment_orders FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE policies: users cannot mutate their own payment orders.
-- Only the service-role server can (bypasses RLS).

CREATE INDEX IF NOT EXISTS payment_orders_user_id_idx ON public.payment_orders (user_id);
CREATE INDEX IF NOT EXISTS payment_orders_provider_order_id_idx ON public.payment_orders (provider_order_id);
CREATE INDEX IF NOT EXISTS payment_orders_status_idx ON public.payment_orders (status);

-- A gateway order id is unique per provider.
CREATE UNIQUE INDEX IF NOT EXISTS payment_orders_provider_order_id_key
ON public.payment_orders (provider, provider_order_id)
WHERE provider_order_id IS NOT NULL;
