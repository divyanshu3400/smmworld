/*
# Core Tables for SMM Panel

Essential tables for the application:
- profiles: User profile data (names, etc.)
- user_settings: User preferences (currency, notifications)
- wallets: User balance tracking with locked currency
- wallet_transactions: Transaction history
- orders: SMM order tracking
- notifications: User notifications
*/

-- ── profiles ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  avatar_url text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile"
ON public.profiles FOR SELECT
TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile"
ON public.profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
CREATE POLICY "insert_own_profile"
ON public.profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

-- ── user_settings ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_currency text NOT NULL DEFAULT 'INR',
  email_notifications boolean NOT NULL DEFAULT true,
  push_notifications boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_user_settings" ON public.user_settings;
CREATE POLICY "select_own_user_settings"
ON public.user_settings FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_user_settings" ON public.user_settings;
CREATE POLICY "update_own_user_settings"
ON public.user_settings FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_user_settings" ON public.user_settings;
CREATE POLICY "insert_own_user_settings"
ON public.user_settings FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

-- ── wallets ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_wallet" ON public.wallets;
CREATE POLICY "select_own_wallet"
ON public.wallets FOR SELECT
TO authenticated USING (auth.uid() = user_id);

-- No insert/update/delete for users - only server-side via service role

CREATE INDEX IF NOT EXISTS wallets_user_id_idx ON public.wallets (user_id);

-- ── wallet_transactions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('credit', 'debit', 'purchase', 'refund')),
  amount numeric NOT NULL CHECK (amount > 0),
  description text,
  reference_id text,
  balance_after numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "select_own_wallet_transactions"
ON public.wallet_transactions FOR SELECT
TO authenticated USING (auth.uid() = user_id);

-- No insert/update/delete for users - only server-side via service role

CREATE INDEX IF NOT EXISTS wallet_transactions_wallet_id_idx ON public.wallet_transactions (wallet_id);
CREATE INDEX IF NOT EXISTS wallet_transactions_user_id_idx ON public.wallet_transactions (user_id);
CREATE INDEX IF NOT EXISTS wallet_transactions_reference_id_idx ON public.wallet_transactions (reference_id);

-- Unique constraint to prevent double-credit for same payment
CREATE UNIQUE INDEX IF NOT EXISTS wallet_transactions_reference_unique
ON public.wallet_transactions (reference_id, type)
WHERE type IN ('credit', 'refund');

-- ── orders ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id text NOT NULL,
  service_name text NOT NULL,
  platform text,
  link text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  price_usd numeric,
  sell_rate_inr numeric,
  provider_cost_inr numeric,
  user_charged_inr numeric,
  external_order_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'in_progress', 'completed', 'partial', 'cancelled', 'refunded')),
  error_message text,
  start_count integer,
  remains integer,
  charge numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_orders" ON public.orders;
CREATE POLICY "select_own_orders"
ON public.orders FOR SELECT
TO authenticated USING (auth.uid() = user_id);

-- No insert/update/delete for users - only server-side via service role

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders (status);
CREATE INDEX IF NOT EXISTS orders_external_order_id_idx ON public.orders (external_order_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders (created_at);

-- ── notifications ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  action_url text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON public.notifications;
CREATE POLICY "select_own_notifications"
ON public.notifications FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON public.notifications;
CREATE POLICY "update_own_notifications"
ON public.notifications FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- No insert/delete for users - insert via service role, delete via cascade

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications (created_at);