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

const BASE = apiUrl('/api/chat')

async function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${BASE}${path}`, {
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

export async function getMessages(page = 1): Promise<{ data: ChatMessage[]; total: number; hasMore: boolean }> {
  return authFetch(`/messages?page=${page}&pageSize=50`)
}

export async function sendMessage(message: string): Promise<ChatMessage> {
  return authFetch('/messages', { method: 'POST', body: JSON.stringify({ message }) })
}

export async function getUnreadChatCount(): Promise<number> {
  const data = await authFetch<{ count: number }>('/unread-count')
  return data.count
}

export function subscribeToChatMessages(userId: string, onMessage: (msg: ChatMessage) => void) {
  return supabase
    .channel(`chat:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `user_id=eq.${userId}` },
      (payload) => onMessage(payload.new as ChatMessage)
    )
    .subscribe()
}
