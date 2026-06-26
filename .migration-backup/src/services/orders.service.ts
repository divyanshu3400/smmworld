import { supabase } from '@/lib/supabase'
import { handleSupabaseError } from '@/lib/error-handler'
import { smmApi, type CreateOrderParams } from './smm-api.service'
import { convertCurrencySync, getExchangeRates } from './exchange-rate.service'
import type { Database } from '@/types/database'
import type { PaginatedResponse } from '@/types/api'

type Order = Database['public']['Tables']['orders']['Row']
type OrderInsert = Database['public']['Tables']['orders']['Insert']

export type OrderStatusType = Order['status']

export interface CreateOrderData {
  serviceId: number
  serviceName: string
  platform: string
  link: string
  quantity: number
  price: number
  currency?: string
}

export async function createOrder(
  userId: string,
  orderData: CreateOrderData,
  userCurrency: string = 'USD'
): Promise<{ success: boolean; order?: Order; error?: string }> {
  try {
    // Get exchange rates for conversion
    const rates = await getExchangeRates()
    const priceUSD = convertCurrencySync(orderData.price, orderData.currency || 'USD', 'USD', rates)
    const priceInUserCurrency = convertCurrencySync(priceUSD, 'USD', userCurrency, rates)

    // Call external API
    const externalOrder = await smmApi.createOrder({
      service: orderData.serviceId,
      link: orderData.link,
      quantity: orderData.quantity,
    })

    if ('error' in externalOrder && externalOrder.error) {
      return { success: false, error: externalOrder.error }
    }

    // Save order to database
    const orderInsert: Record<string, unknown> = {
      user_id: userId,
      external_order_id: String(externalOrder.order),
      service_id: String(orderData.serviceId),
      service_name: orderData.serviceName,
      platform: orderData.platform,
      link: orderData.link,
      quantity: orderData.quantity,
      price: priceInUserCurrency,
      currency: userCurrency,
      price_usd: priceUSD,
      status: 'pending',
    }

    const { data, error } = await supabase
      .from('orders')
      .insert(orderInsert as never)
      .select()
      .single()

    if (error) {
      console.error('Failed to save order:', error)
      return { success: false, error: 'Failed to save order to database' }
    }

    // Deduct from wallet
    const { error: walletError } = await deductFromWallet(userId, priceUSD)
    if (walletError) {
      console.error('Failed to deduct from wallet:', walletError)
    }

    return { success: true, order: data as Order }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

async function deductFromWallet(userId: string, amountUSD: number): Promise<{ error?: string }> {
  // Get current wallet balance
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (walletError) {
    return { error: 'Failed to get wallet balance' }
  }

  const currentBalance = (wallet as { balance: number }).balance
  if (currentBalance < amountUSD) {
    return { error: 'Insufficient balance' }
  }

  // Update wallet balance
  const newBalance = currentBalance - amountUSD
  const { error: updateError } = await supabase
    .from('wallets')
    .update({ balance: newBalance } as never)
    .eq('user_id', userId)

  if (updateError) {
    return { error: 'Failed to update wallet balance' }
  }

  // Record transaction
  const { error: txError } = await supabase
    .from('wallet_transactions')
    .insert({
      wallet_id: (wallet as { id: string }).id,
      user_id: userId,
      type: 'purchase',
      amount: amountUSD,
      description: 'Order payment',
      balance_after: newBalance,
    } as never)

  if (txError) {
    console.error('Failed to record transaction:', txError)
  }

  return {}
}

export async function getUserOrders(
  userId: string,
  page: number = 1,
  pageSize: number = 20,
  status?: OrderStatusType
): Promise<PaginatedResponse<Order>> {
  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query.range(from, to)

  if (error) throw handleSupabaseError(error)

  return {
    data: (data as Order[]) || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
    hasMore: (count || 0) > page * pageSize,
  }
}

export async function getOrderById(orderId: string, userId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw handleSupabaseError(error)
  }
  return data as Order
}

export async function syncOrderStatus(order: Order): Promise<Order> {
  if (!order.external_order_id) return order

  try {
    const status = await smmApi.getOrderStatus(order.external_order_id)

    const updates: Partial<Order> = {
      status: status.status as OrderStatusType,
      start_count: status.start_count ? parseInt(status.start_count) : undefined,
      remains: status.remains ? parseInt(status.remains) : undefined,
      charge: status.charge ? parseFloat(status.charge) : undefined,
      updated_at: new Date().toISOString(),
    }

    if (status.status === 'completed' || status.status === 'partial' || status.status === 'cancelled') {
      updates.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates as never)
      .eq('id', order.id)
      .select()
      .single()

    if (error) throw handleSupabaseError(error)
    return data as Order
  } catch (err) {
    console.error('Failed to sync order status:', err)
    return order
  }
}

export async function getOrderStats(userId: string): Promise<{
  total: number
  pending: number
  processing: number
  completed: number
  cancelled: number
  totalSpent: number
}> {
  const { data, error } = await supabase
    .from('orders')
    .select('status, price_usd')
    .eq('user_id', userId)

  if (error) throw handleSupabaseError(error)

  const stats = {
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
    totalSpent: 0,
  }

  const orders = data as { status: string; price_usd: number }[]

  orders?.forEach((order) => {
    stats.total++
    stats.totalSpent += order.price_usd || 0

    switch (order.status) {
      case 'pending':
        stats.pending++
        break
      case 'processing':
      case 'in_progress':
        stats.processing++
        break
      case 'completed':
      case 'partial':
        stats.completed++
        break
      case 'cancelled':
      case 'refunded':
        stats.cancelled++
        break
    }
  })

  return stats
}

export async function cancelOrder(orderId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  // Get order
  const order = await getOrderById(orderId, userId)
  if (!order) {
    return { success: false, error: 'Order not found' }
  }

  if (order.status === 'completed' || order.status === 'cancelled') {
    return { success: false, error: 'Cannot cancel this order' }
  }

  // Try to cancel on external API
  if (order.external_order_id) {
    try {
      const result = await smmApi.cancelOrder(order.external_order_id)
      if (!result.success) {
        console.log('External cancel failed, proceeding with local cancel')
      }
    } catch (err) {
      console.log('External cancel error:', err)
    }
  }

  // Update local status
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', orderId)

  if (error) {
    return { success: false, error: 'Failed to cancel order' }
  }

  // Refund to wallet
  if (order.price_usd) {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (wallet) {
      const walletData = wallet as { id: string; balance: number }
      const newBalance = walletData.balance + order.price_usd

      await supabase
        .from('wallets')
        .update({ balance: newBalance } as never)
        .eq('user_id', userId)

      await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: walletData.id,
          user_id: userId,
          type: 'refund',
          amount: order.price_usd,
          description: `Refund for cancelled order #${orderId}`,
          balance_after: newBalance,
        } as never)
    }
  }

  return { success: true }
}
