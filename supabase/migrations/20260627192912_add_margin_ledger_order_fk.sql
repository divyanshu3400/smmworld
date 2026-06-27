/*
# Add foreign key constraint for margin_ledger to orders table
*/

ALTER TABLE public.margin_ledger
ADD CONSTRAINT margin_ledger_order_id_fkey
FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;