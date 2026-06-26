import { supabase } from '@/lib/supabase'

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not authenticated')
  return token
}

async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getToken()
  const res = await fetch(`/api/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...((options?.headers as Record<string, string>) || {}),
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`)
  return data as T
}

export interface AdminOverview {
  providerBalance: { balance: string; currency: string }
  totalRevenue: number
  totalOrders: number
  activeOrders: number
  totalUsers: number
  ordersToday: number
  ordersByStatus: Record<string, number>
  revenueChart: { date: string; revenue: number }[]
  recentOrders: AdminOrder[]
}

export interface AdminOrder {
  id: string
  user_id: string
  user_name: string
  external_order_id: string | null
  service_id: string
  service_name: string
  platform: string | null
  link: string
  quantity: number
  price: number
  currency: string
  price_usd: number
  status: string
  start_count: number | null
  remains: number | null
  charge: number | null
  error_message: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

export interface AdminUser {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  balance: number
  currency: string
  total_orders: number
  created_at: string
  last_sign_in_at: string | null
  is_confirmed: boolean
}

export async function checkAdminStatus(): Promise<boolean> {
  try {
    const token = await getToken()
    const res = await fetch('/api/admin/check', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return false
    const data = await res.json()
    return data.isAdmin === true
  } catch {
    return false
  }
}

export async function getAdminOverview(): Promise<AdminOverview> {
  return adminFetch<AdminOverview>('/overview')
}

export async function getAdminOrders(
  page = 1,
  limit = 20,
  status = '',
  search = ''
): Promise<{ orders: AdminOrder[]; total: number; page: number }> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(status && status !== 'all' && { status }),
    ...(search && { search }),
  })
  return adminFetch(`/orders?${params}`)
}

export async function getAdminUsers(
  page = 1,
  limit = 20,
  search = ''
): Promise<{ users: AdminUser[]; total: number; page: number }> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search && { search }),
  })
  return adminFetch(`/users?${params}`)
}

export async function syncAdminOrder(
  orderId: string
): Promise<{ success: boolean; status: string }> {
  return adminFetch(`/orders/${orderId}/sync`, { method: 'POST' })
}

export async function cancelAdminOrder(orderId: string): Promise<{ success: boolean }> {
  return adminFetch(`/orders/${orderId}/cancel`, { method: 'POST' })
}

export async function adjustUserWallet(
  userId: string,
  amount: number,
  type: 'credit' | 'debit',
  description: string
): Promise<{ success: boolean; newBalance: number }> {
  return adminFetch(`/users/${userId}/wallet/adjust`, {
    method: 'POST',
    body: JSON.stringify({ amount, type, description }),
  })
}
