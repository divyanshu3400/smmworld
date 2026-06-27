-- Backfill wallets.currency to INR and fix historical balances
--
-- Problem: All wallets were created with currency='USD' (the column default),
-- but all payments were processed through INR-only gateways (Cashfree).
-- The verify route unconditionally converted INR→USD before crediting,
-- so a ₹10 top-up was credited as ~$0.12 instead of ₹10.
--
-- This migration:
-- 1. Fixes wallet_transactions.amount to reflect original INR amounts
-- 2. Recalculates wallet_transactions.balance_after
-- 3. Recalculates wallets.balance from corrected transactions
-- 4. Sets wallets.currency = 'INR' for all existing wallets
-- 5. Logs which wallets were backfilled

-- ── 1. Create backfill log table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public._migration_backfill_log (
    id serial PRIMARY KEY,
    migration_name text NOT NULL,
    user_id uuid,
    wallet_id uuid,
    old_currency text,
    new_currency text,
    old_balance numeric,
    new_balance numeric,
    backfilled_at timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Log wallets before backfill ────────────────────────────────────────────
INSERT INTO public._migration_backfill_log (migration_name, user_id, wallet_id, old_currency, old_balance)
SELECT 'backfill_wallet_currency_to_inr', user_id, id, currency, balance
FROM public.wallets;

-- ── 3. Fix transaction amounts from original INR amounts in payment_orders ───
-- The reference_id in wallet_transactions is '<provider>_<provider_payment_id>'
-- and payment_orders stores provider_payment_id separately.
UPDATE public.wallet_transactions wt
SET amount = po.amount_inr
FROM public.payment_orders po
WHERE wt.reference_id = po.provider || '_' || po.provider_payment_id
  AND po.status = 'paid'
  AND po.provider_payment_id IS NOT NULL;

-- ── 4. Recalculate balance_after for each transaction ────────────────────────
-- Recalculate in chronological order within each wallet.
DO $$
DECLARE
    wt_record RECORD;
    running_balance NUMERIC;
    current_wallet_id uuid := NULL;
BEGIN
    FOR wt_record IN
        SELECT id, wallet_id, amount, type
        FROM public.wallet_transactions
        ORDER BY wallet_id, created_at
    LOOP
        IF current_wallet_id IS NULL OR current_wallet_id <> wt_record.wallet_id THEN
            running_balance := 0;
            current_wallet_id := wt_record.wallet_id;
        END IF;

        IF wt_record.type IN ('credit', 'bonus', 'refund') THEN
            running_balance := running_balance + wt_record.amount;
        ELSE
            running_balance := running_balance - wt_record.amount;
        END IF;

        UPDATE public.wallet_transactions
        SET balance_after = running_balance
        WHERE id = wt_record.id;
    END LOOP;
END $$;

-- ── 5. Recalculate wallet balances and set currency to INR ───────────────────
-- For wallets with transactions: balance = last transaction's balance_after
UPDATE public.wallets w
SET
    balance = COALESCE(
        (SELECT balance_after
         FROM public.wallet_transactions wt
         WHERE wt.wallet_id = w.id
         ORDER BY wt.created_at DESC
         LIMIT 1),
        0
    ),
    currency = 'INR',
    updated_at = now()
WHERE EXISTS (
    SELECT 1 FROM public.wallet_transactions wt WHERE wt.wallet_id = w.id
);

-- For wallets with no transactions (zero balance): set currency to INR
-- since Cashfree is INR-only today
UPDATE public.wallets
SET currency = 'INR', updated_at = now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.wallet_transactions wt WHERE wt.wallet_id = wallets.id
);

-- ── 6. Update the log with new values ────────────────────────────────────────
UPDATE public._migration_backfill_log l
SET new_currency = w.currency, new_balance = w.balance
FROM public.wallets w
WHERE l.wallet_id = w.id AND l.migration_name = 'backfill_wallet_currency_to_inr';

-- ── 7. Raise notices for audit trail ──────────────────────────────────────────
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT user_id, old_currency, new_currency, old_balance, new_balance
        FROM public._migration_backfill_log
        WHERE migration_name = 'backfill_wallet_currency_to_inr'
    LOOP
        RAISE NOTICE 'Backfilled wallet for user %: % % -> % %',
            r.user_id, r.old_balance, r.old_currency, r.new_balance, r.new_currency;
    END LOOP;
END $$;
