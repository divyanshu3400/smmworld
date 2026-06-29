import { supabase } from '@/lib/supabase'
import { apiUrl } from '@/lib/api'

export interface ChatMessage {
  id: string
  user_id: string
  message: string
  sender: 'user' | 'admin'
  is_read: boolean
  created_at: string
}

export interface Conversation {
  user_id: string
  last_message: string
  last_at: string
  unread: number
  email?: string | null
}

// ─── shared helper ────────────────────────────────────────────────────────────

async function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(apiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers as Record<string, string>),
    },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error ?? `Request failed: ${res.status}`)
  return json as T
}

// ─── user apis ────────────────────────────────────────────────────────────────

export async function getMessages(
  page = 1
): Promise<{ data: ChatMessage[]; total: number; hasMore: boolean }> {
  return authFetch(`/api/chat/messages?page=${page}&pageSize=50`)
}

export async function sendMessage(message: string): Promise<ChatMessage> {
  return authFetch('/api/chat/messages', {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

export async function getUnreadChatCount(): Promise<number> {
  const data = await authFetch<{ count: number }>('/api/chat/unread-count')
  return data.count
}

export async function markMessageRead(id: string): Promise<void> {
  await authFetch(`/api/chat/messages/${id}/read`, { method: 'PATCH' })
}

export function subscribeToChatMessages(
  userId: string,
  onMessage: (msg: ChatMessage) => void
) {
  const channelName = `chat:${userId}`
  // Remove any stale channel with the same name before subscribing
  const existing = supabase.getChannels().find((c) => c.topic === `realtime:${channelName}`)
  if (existing) supabase.removeChannel(existing)

  return supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onMessage(payload.new as ChatMessage)
    )
    .subscribe()
}

// ─── admin apis ───────────────────────────────────────────────────────────────

export async function getAdminConversations(): Promise<Conversation[]> {
  const data = await authFetch<{ conversations: Conversation[] }>(
    '/api/chat/admin/conversations'
  )
  return data.conversations
}

export async function getAdminMessages(
  userId: string,
  page = 1,
  pageSize = 50
): Promise<{ data: ChatMessage[]; total: number; hasMore: boolean }> {
  return authFetch(
    `/api/chat/admin/messages/${userId}?page=${page}&pageSize=${pageSize}`
  )
}

export async function sendAdminReply(
  userId: string,
  message: string
): Promise<ChatMessage> {
  return authFetch('/api/chat/admin/reply', {
    method: 'POST',
    body: JSON.stringify({ userId, message }),
  })
}

export async function markConversationRead(userId: string): Promise<void> {
  await authFetch(`/api/chat/admin/mark-read/${userId}`, { method: 'POST' })
}

export function subscribeToAdminChat(
  userId: string,
  onMessage: () => void
) {
  const channelName = `admin-chat:${userId}`
  const existing = supabase.getChannels().find((c) => c.topic === `realtime:${channelName}`)
  if (existing) supabase.removeChannel(existing)

  return supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `user_id=eq.${userId}`,
      },
      onMessage
    )
    .subscribe()
}