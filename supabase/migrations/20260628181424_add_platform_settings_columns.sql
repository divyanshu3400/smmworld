/*
# Add additional platform settings columns
*/

ALTER TABLE public.platform_settings
ADD COLUMN IF NOT EXISTS quantity_factor numeric NOT NULL DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS min_order_charge_inr numeric NOT NULL DEFAULT 0;