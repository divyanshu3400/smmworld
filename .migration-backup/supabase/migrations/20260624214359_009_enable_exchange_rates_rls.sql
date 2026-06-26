-- Enable RLS on exchange_rates (public read)
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exchange_rates_select_all" ON public.exchange_rates
  FOR SELECT TO authenticated USING (true);