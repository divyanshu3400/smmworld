import { supabase } from '@/lib/supabase'
import { handleSupabaseError } from '@/lib/error-handler'
import type { DashboardStats, ChartDataPoint } from '@/types/api'
import type { Wallet, WalletTransaction } from '@/types/database'

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .single()

  if (walletError && walletError.code !== 'PGRST116') {
    throw handleSupabaseError(walletError)
  }

  const { count: unreadNotifications, error: notifError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)

  if (notifError) throw handleSupabaseError(notifError)

  const { count: recentTransactions, error: txError } = await supabase
    .from('wallet_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  if (txError) throw handleSupabaseError(txError)

  const walletData = wallet as Wallet | null
  return {
    walletBalance: walletData?.balance || 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    recentTransactions: recentTransactions || 0,
    unreadNotifications: unreadNotifications || 0,
  }
}

export async function getMonthlySpending(userId: string): Promise<ChartDataPoint[]> {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('amount, created_at, type')
    .eq('user_id', userId)
    .gte('created_at', sixMonthsAgo.toISOString())
    .order('created_at', { ascending: true })

  if (error) throw handleSupabaseError(error)

  const monthlyData: Record<string, number> = {}
  const typedData = data as WalletTransaction[]

  typedData?.forEach((tx) => {
    const month = tx.created_at.substring(0, 7)
    if (!monthlyData[month]) {
      monthlyData[month] = 0
    }

    if (tx.type === 'purchase' || tx.type === 'debit') {
      monthlyData[month] += tx.amount
    }
  })

  return Object.entries(monthlyData).map(([date, value]) => ({
    date,
    value,
  }))
}

export async function getBalanceHistory(
  userId: string,
  days: number = 30
): Promise<ChartDataPoint[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('balance_after, created_at')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true })

  if (error) throw handleSupabaseError(error)

  const typedData = data as Pick<WalletTransaction, 'balance_after' | 'created_at'>[]

  return typedData?.map((tx) => ({
    date: tx.created_at.split('T')[0],
    value: tx.balance_after,
  })) || []
}
