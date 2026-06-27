/*
# Exchange Rates Table

Stores USD-based exchange rates for currency conversion.
All rates are stored as USD → target_currency (e.g., USD → INR = 83.5 means 1 USD = 83.5 INR).

To convert any currency pair:
  - FROM → USD: amount / rate
  - USD → TO: amount * rate
  - Cross-currency: (amount / fromRate) * toRate
*/

CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  base_currency text NOT NULL DEFAULT 'USD',
  target_currency text NOT NULL,
  rate numeric NOT NULL CHECK (rate > 0),
  source text,
  last_updated timestamptz NOT NULL DEFAULT now(),
  UNIQUE(base_currency, target_currency)
);

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read exchange rates
DROP POLICY IF EXISTS "read_exchange_rates" ON public.exchange_rates;
CREATE POLICY "read_exchange_rates"
ON public.exchange_rates FOR SELECT
TO authenticated USING (true);

-- Only server-side (service role) can write
DROP POLICY IF EXISTS "admin_write_exchange_rates" ON public.exchange_rates;
CREATE POLICY "admin_write_exchange_rates"
ON public.exchange_rates FOR ALL
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Seed common rates (USD → INR, USD → TRY, etc.)
INSERT INTO public.exchange_rates (target_currency, rate, source) VALUES
  ('INR', 83.5, 'manual'),
  ('TRY', 32.5, 'manual'),
  ('EUR', 0.92, 'manual'),
  ('GBP', 0.79, 'manual'),
  ('AED', 3.67, 'manual'),
  ('SAR', 3.75, 'manual')
ON CONFLICT (base_currency, target_currency) DO NOTHING;

CREATE INDEX IF NOT EXISTS exchange_rates_target_currency_idx ON public.exchange_rates (target_currency);