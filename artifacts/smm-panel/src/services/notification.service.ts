import { supabase } from '@/lib/supabase'
import { handleSupabaseError } from '@/lib/error-handler'
import type { Notification } from '@/types/database'
import type { NotificationFilter, PaginatedResponse } from '@/types/api'

export async function getNotifications(
  userId: string,
  filter?: NotificationFilter,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<Notification>> {
  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (filter?.type && filter.type !== 'all') {
    query = query.eq('type', filter.type)
  }

  if (filter?.read !== undefined && filter?.read !== 'all') {
    if (filter.read) {
      query = query.not('read_at', 'is', null)
    } else {
      query = query.is('read_at', null)
    }
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query.range(from, to)

  if (error) throw handleSupabaseError(error)

  return {
    data: (data as Notification[]) || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
    hasMore: (count || 0) > page * pageSize,
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)

  if (error) throw handleSupabaseError(error)
  return count || 0
}

export async function markAsRead(notificationId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)

  if (error) throw handleSupabaseError(error)
}

export async function markAllAsRead(userId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)

  if (error) throw handleSupabaseError(error)
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)

  if (error) throw handleSupabaseError(error)
}

export async function clearAllRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
    .not('read_at', 'is', null)

  if (error) throw handleSupabaseError(error)
}

export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void
) {
  return supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as Notification)
      }
    )
    .subscribe()
}
