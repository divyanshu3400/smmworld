/*
# Wallet Balance RPC Functions

Atomic wallet operations for balance deduction and crediting.
*/

CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(
  p_wallet_id uuid,
  p_amount numeric,
  p_expected_balance numeric DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance numeric;
BEGIN
  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM wallets
  WHERE id = p_wallet_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  -- If expected_balance provided, verify it matches (optimistic concurrency)
  IF p_expected_balance IS NOT NULL AND v_current_balance != p_expected_balance THEN
    RETURN false;
  END IF;

  -- Check sufficient balance
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Update balance
  UPDATE wallets
  SET balance = balance - p_amount,
      updated_at = now()
  WHERE id = p_wallet_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.credit_wallet_balance(
  p_wallet_id uuid,
  p_amount numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE wallets
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE id = p_wallet_id;

  RETURN found;
END;
$$;