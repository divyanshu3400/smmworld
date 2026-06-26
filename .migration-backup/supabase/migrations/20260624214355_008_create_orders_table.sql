-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  external_order_id TEXT,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  platform TEXT,
  link TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(15,4) NOT NULL,
  currency TEXT DEFAULT 'USD',
  price_usd DECIMAL(15,4) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'in_progress', 'completed', 'partial', 'cancelled', 'refunded')),
  start_count INTEGER,
  remains INTEGER,
  charge DECIMAL(15,4),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_external_order_id ON public.orders(external_order_id);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_update_own" ON public.orders
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Add currency column to wallets if not exists
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Add currency column to user_settings if not exists
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'USD';

-- Create exchange_rates table for currency conversion caching
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL DEFAULT 'USD',
  target_currency TEXT NOT NULL,
  rate DECIMAL(15,8) NOT NULL,
  source TEXT DEFAULT 'manual',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(target_currency)
);

-- Insert default exchange rates (manual, will be updated by API if available)
INSERT INTO public.exchange_rates (target_currency, rate) VALUES
  ('EUR', 0.92),
  ('GBP', 0.79),
  ('INR', 83.12),
  ('BRL', 4.97),
  ('PHP', 56.45),
  ('IDR', 15750.00),
  ('NGN', 1550.00),
  ('TRY', 32.50)
ON CONFLICT (target_currency) DO NOTHING;