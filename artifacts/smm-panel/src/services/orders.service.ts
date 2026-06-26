import { supabase } from '@/lib/supabase'
import { handleSupabaseError } from '@/lib/error-handler'
import {
  createOrder as apiCreateOrder,
  syncOrderStatus as apiSyncOrderStatus,
  cancelOrder as apiCancelOrder,
} from './smm-api.service'
import type { Database } from '@/types/database'
import type { PaginatedResponse } from '@/types/api'

type Order = Database['public']['Tables']['orders']['Row']

export type OrderStatusType = Order['status']

export interface CreateOrderData {
  serviceId: number
  serviceName: string
  platform: string
  link: string
  quantity: number
  priceUsd: number
}

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not authenticated')
  return token
}

export async function createOrder(
  _userId: string,
  orderData: CreateOrderData,
  _userCurrency: string = 'USD'
): Promise<{ success: boolean; order?: Order; error?: string }> {
  try {
    const token = await getToken()
    const result = await apiCreateOrder(
      {
        serviceId: orderData.serviceId,
        serviceName: orderData.serviceName,
        platform: orderData.platform,
        link: orderData.link,
        quantity: orderData.quantity,
        priceUsd: orderData.priceUsd,
      },
      token
    )

    if (!result.success) {
      return { success: false, error: 'Order creation failed' }
    }

    // Fetch the created order from DB to return to UI
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', result.orderId)
      .single()

    if (!order) {
      return { success: false, error: 'Order created but not found in DB' }
    }

    return { success: true, order: order as Order }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
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
    const token = await getToken()
    const updated = await apiSyncOrderStatus(order.id, token)
    return { ...order, ...updated } as Order
  } catch {
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
      case 'pending': stats.pending++; break
      case 'processing':
      case 'in_progress': stats.processing++; break
      case 'completed':
      case 'partial': stats.completed++; break
      case 'cancelled':
      case 'refunded': stats.cancelled++; break
    }
  })

  return stats
}

export async function cancelOrder(
  orderId: string,
  _userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getToken()
    return await apiCancelOrder(orderId, token)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}
