/*
# SMM Order Margin System Tables

## Purpose
Adds support for:
  1. Platform-wide settings (markup %, gateway fee %)
  2. Local service catalog cache from WorldOfSMM
  3. Per-order margin tracking for profit analysis

## Tables

### `platform_settings`
Singleton config table for platform-wide settings that affect pricing.
Extends the existing payment_settings pattern.

- `markup_percent` - Global markup applied to all SMM services (e.g., 20 = 20% markup)
- `cashfree_fee_percent` - Gateway fee deducted from Cashfree top-ups

### `smm_services_cache`
Local cache of WorldOfSMM service catalog. Synced via admin endpoint.
Stores provider rates in INR so we can compute sell prices dynamically:
  sell_rate_inr = provider_rate_inr * (1 + markup_percent / 100)

- `service_id` - WorldOfSMM service ID
- `name`, `type`, `category` - Service metadata
- `provider_rate` - Rate per 1000 units in provider's currency (from API)
- `provider_rate_inr` - Converted rate in INR (stored for historical accuracy)
- `min`, `max` - Order quantity bounds

### `margin_ledger`
Records profit/margin for each order:
  margin_inr = user_charged_inr_equivalent - provider_cost_inr

- `order_id` - References the orders table
- `user_charged_amount`, `user_charged_currency` - What the user paid
- `user_charged_inr_equivalent` - User payment converted to INR
- `provider_cost_inr` - What WorldOfSMM charged (from API's charge field)
- `margin_inr` - Profit earned on this order
- `markup_percent_applied` - The markup % at time of order
*/

-- ── platform_settings (singleton) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  markup_percent numeric NOT NULL DEFAULT 20 CHECK (markup_percent >= 0 AND markup_percent <= 500),
  cashfree_fee_percent numeric NOT NULL DEFAULT 0 CHECK (cashfree_fee_percent >= 0 AND cashfree_fee_percent <= 100),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read platform settings (needed for pricing display).
-- Only admins can write.
DROP POLICY IF EXISTS "read_platform_settings" ON public.platform_settings;
CREATE POLICY "read_platform_settings"
ON public.platform_settings FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_write_platform_settings" ON public.platform_settings;
CREATE POLICY "admin_write_platform_settings"
ON public.platform_settings FOR ALL
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Seed the singleton row
INSERT INTO public.platform_settings (id, markup_percent, cashfree_fee_percent)
VALUES (1, 20, 2)
ON CONFLICT (id) DO NOTHING;

-- ── smm_services_cache ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.smm_services_cache (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  service_id integer NOT NULL UNIQUE,
  name text NOT NULL,
  type text,
  category text,
  description text,
  provider_rate text,
  provider_rate_inr numeric,
  min text,
  max text,
  last_synced_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.smm_services_cache ENABLE ROW LEVEL SECURITY;

-- Public read (services catalog is visible to all authenticated users)
DROP POLICY IF EXISTS "read_smm_services_cache" ON public.smm_services_cache;
CREATE POLICY "read_smm_services_cache"
ON public.smm_services_cache FOR SELECT
TO authenticated USING (true);

-- Only server-side (service role) can write, so no INSERT/UPDATE policies for users

CREATE INDEX IF NOT EXISTS smm_services_cache_service_id_idx ON public.smm_services_cache (service_id);
CREATE INDEX IF NOT EXISTS smm_services_cache_category_idx ON public.smm_services_cache (category);

-- ── margin_ledger ───────────────────────────────────────────────────────────────
-- Note: order_id references orders table which must be created first.
-- This table will be created after orders table exists.
-- For now, we create it without the foreign key constraint.

CREATE TABLE IF NOT EXISTS public.margin_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_charged_amount numeric NOT NULL,
  user_charged_currency text NOT NULL,
  user_charged_inr_equivalent numeric NOT NULL,
  provider_cost_inr numeric,
  markup_percent_applied numeric NOT NULL,
  refund_adjustment_inr numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add generated columns for margin calculation
ALTER TABLE public.margin_ledger
ADD COLUMN IF NOT EXISTS margin_inr numeric GENERATED ALWAYS AS (
  COALESCE(user_charged_inr_equivalent, 0) - COALESCE(provider_cost_inr, 0)
) STORED;

ALTER TABLE public.margin_ledger
ADD COLUMN IF NOT EXISTS final_margin_inr numeric GENERATED ALWAYS AS (
  COALESCE(user_charged_inr_equivalent, 0) - COALESCE(provider_cost_inr, 0) - COALESCE(refund_adjustment_inr, 0)
) STORED;

ALTER TABLE public.margin_ledger ENABLE ROW LEVEL SECURITY;

-- Users can read their own margin entries (for their order history)
-- Admins can read all
DROP POLICY IF EXISTS "select_own_margin_ledger" ON public.margin_ledger;
CREATE POLICY "select_own_margin_ledger"
ON public.margin_ledger FOR SELECT
TO authenticated USING (auth.uid() = user_id OR public.is_admin());

-- Only server-side (service role) can insert/update
DROP POLICY IF EXISTS "admin_all_margin_ledger" ON public.margin_ledger;
CREATE POLICY "admin_all_margin_ledger"
ON public.margin_ledger FOR ALL
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS margin_ledger_order_id_idx ON public.margin_ledger (order_id);
CREATE INDEX IF NOT EXISTS margin_ledger_user_id_idx ON public.margin_ledger (user_id);
CREATE INDEX IF NOT EXISTS margin_ledger_created_at_idx ON public.margin_ledger (created_at);