import { supabase } from '@/lib/supabase'
import { handleSupabaseError } from '@/lib/error-handler'
import type { ReferralStats, PaginatedResponse } from '@/types/api'

export async function getReferralCode(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('id', userId)
    .single()

  if (error) throw handleSupabaseError(error)
  return (data as { referral_code: string | null })?.referral_code || null
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('id', userId)
    .single()

  if (profileError) throw handleSupabaseError(profileError)

  const { count: totalReferrals, error: countError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('referred_by', userId)

  if (countError) throw handleSupabaseError(countError)

  const { data: referredUsers, error: referredError } = await supabase
    .from('profiles')
    .select('id')
    .eq('referred_by', userId)
    .limit(100)

  if (referredError) throw handleSupabaseError(referredError)

  let commissionEarned = 0
  if (referredUsers && referredUsers.length > 0) {
    const userIds = (referredUsers as { id: string }[]).map((u) => u.id)
    const { data: transactions, error: txError } = await supabase
      .from('wallet_transactions')
      .select('amount')
      .eq('type', 'bonus')
      .in('user_id', userIds)

    if (!txError && transactions) {
      commissionEarned = (transactions as { amount: number }[]).reduce(
        (sum, tx) => sum + tx.amount,
        0
      )
    }
  }

  const profileData = profile as { referral_code: string | null }

  return {
    referralCode: profileData?.referral_code || '',
    totalReferrals: totalReferrals || 0,
    activeReferrals: totalReferrals || 0,
    commissionEarned,
  }
}

export async function getReferredUsers(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<{ id: string; first_name: string | null; last_name: string | null; created_at: string }>> {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, created_at', { count: 'exact' })
    .eq('referred_by', userId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw handleSupabaseError(error)

  return {
    data: (data as { id: string; first_name: string | null; last_name: string | null; created_at: string }[]) || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
    hasMore: (count || 0) > page * pageSize,
  }
}

export async function validateReferralCode(code: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('referral_code', code)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return false
    throw handleSupabaseError(error)
  }
  return !!data
}

export async function applyReferralCode(
  userId: string,
  referralCode: string
): Promise<void> {
  const { data: referrerId, error: referrerError } = await supabase
    .from('profiles')
    .select('id')
    .eq('referral_code', referralCode)
    .single()

  if (referrerError) throw handleSupabaseError(referrerError)

  const referrerData = referrerId as { id: string }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from('profiles')
    .update({ referred_by: referrerData.id })
    .eq('id', userId)

  if (updateError) throw handleSupabaseError(updateError)
}
