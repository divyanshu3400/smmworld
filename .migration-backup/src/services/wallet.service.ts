import { supabase } from '@/lib/supabase'
import { handleSupabaseError } from '@/lib/error-handler'
import type { Wallet, WalletTransaction, ExchangeRate } from '@/types/database'
import type { WalletTransactionFilter, PaginatedResponse } from '@/types/api'
import { convertCurrencySync } from './exchange-rate.service'

export async function getWallet(userId: string): Promise<Wallet | null> {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw handleSupabaseError(error)
  }
  return data as Wallet
}

export async function getTransactions(
  userId: string,
  filter?: WalletTransactionFilter,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<WalletTransaction>> {
  let query = supabase
    .from('wallet_transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (filter?.type && filter.type !== 'all') {
    query = query.eq('type', filter.type)
  }

  if (filter?.startDate) {
    query = query.gte('created_at', filter.startDate)
  }

  if (filter?.endDate) {
    query = query.lte('created_at', filter.endDate)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query.range(from, to)

  if (error) throw handleSupabaseError(error)

  return {
    data: (data as WalletTransaction[]) || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
    hasMore: (count || 0) > page * pageSize,
  }
}

export async function getTransactionById(
  transactionId: string
): Promise<WalletTransaction | null> {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('id', transactionId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw handleSupabaseError(error)
  }
  return data as WalletTransaction
}

export async function getRecentTransactions(
  userId: string,
  limit: number = 10
): Promise<WalletTransaction[]> {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw handleSupabaseError(error)
  return (data as WalletTransaction[]) || []
}

export async function getTransactionStats(userId: string, currency: string = 'USD'): Promise<{
  totalCredits: number
  totalDebits: number
  transactionCount: number
}> {
  // Get exchange rates
  const { data: ratesData } = await supabase
    .from('exchange_rates')
    .select('*')

  const rates: Record<string, number> = { USD: 1 }
  ratesData?.forEach((r: ExchangeRate) => {
    rates[r.target_currency] = r.rate
  })

  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('type, amount')
    .eq('user_id', userId)

  if (error) throw handleSupabaseError(error)

  const stats = {
    totalCredits: 0,
    totalDebits: 0,
    transactionCount: data?.length || 0,
  }

  const typedData = data as { type: string; amount: number }[] | null
  typedData?.forEach((tx) => {
    // Convert to user's preferred currency
    const amountInCurrency = convertCurrencySync(tx.amount, 'USD', currency, rates)

    if (tx.type === 'credit' || tx.type === 'bonus' || tx.type === 'refund') {
      stats.totalCredits += amountInCurrency
    } else {
      stats.totalDebits += amountInCurrency
    }
  })

  return stats
}

export async function updateWalletCurrency(userId: string, currency: string): Promise<void> {
  const { error } = await supabase
    .from('wallets')
    .update({ currency } as never)
    .eq('user_id', userId)

  if (error) throw handleSupabaseError(error)
}
