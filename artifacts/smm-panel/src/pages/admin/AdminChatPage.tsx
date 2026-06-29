import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MessageCircle,
  Send,
  Loader2,
  Users,
  Clock,
  Search,
  Circle,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdmin } from '@/hooks/useAdmin'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { apiUrl } from '@/lib/api'
import { formatRelativeTime } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Conversation {
  user_id: string
  last_message: string
  last_at: string
  unread: number
  email?: string
}

interface ChatMessage {
  id: string
  user_id: string
  message: string
  sender: 'user' | 'admin'
  is_read: boolean
  created_at: string
}

async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not authenticated')
  const res = await fetch(`${apiUrl('')}${path}`, {
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

async function getConversations(): Promise<Conversation[]> {
  const data = await adminFetch<{ conversations: Conversation[] }>('/api/chat/admin/conversations')
  return data.conversations
}

async function getAdminMessages(userId: string): Promise<ChatMessage[]> {
  const data = await adminFetch<{ data: ChatMessage[] }>(`/api/chat/messages?userId=${userId}&pageSize=100`)
  return data.data ?? []
}

async function sendAdminReply(userId: string, message: string): Promise<void> {
  await adminFetch('/api/chat/admin/reply', {
    method: 'POST',
    body: JSON.stringify({ userId, message }),
  })
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }

export default function AdminChatPage() {
  const { isAdmin, isLoading: adminLoading } = useAdmin()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: conversations = [], isLoading: convsLoading } = useQuery({
    queryKey: ['admin-conversations'],
    queryFn: getConversations,
    enabled: !!isAdmin,
    refetchInterval: 15000,
  })

  const { data: messages = [], isLoading: msgsLoading } = useQuery({
    queryKey: ['admin-chat-messages', selectedUserId],
    queryFn: () => getAdminMessages(selectedUserId!),
    enabled: !!selectedUserId,
    staleTime: 0,
  })

  const replyMutation = useMutation({
    mutationFn: () => sendAdminReply(selectedUserId!, replyText.trim()),
    onSuccess: () => {
      setReplyText('')
      queryClient.invalidateQueries({ queryKey: ['admin-chat-messages', selectedUserId] })
      queryClient.invalidateQueries({ queryKey: ['admin-conversations'] })
      toast.success('Reply sent')
    },
    onError: () => toast.error('Failed to send reply'),
  })

  // Auto-scroll on new messages
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [messages.length, selectedUserId])

  // Realtime: listen for new user messages on selected conversation
  useEffect(() => {
    if (!selectedUserId) return
    const channel = supabase
      .channel(`admin-chat:${selectedUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `user_id=eq.${selectedUserId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-chat-messages', selectedUserId] })
          queryClient.invalidateQueries({ queryKey: ['admin-conversations'] })
        }
      )
      .subscribe()
    return () => { channel.unsubscribe() }
  }, [selectedUserId])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (replyText.trim() && !replyMutation.isPending) replyMutation.mutate()
    }
  }

  if (adminLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    )
  }

  const filteredConversations = conversations.filter((c) =>
    !search || c.user_id.includes(search) || (c.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const selectedConv = conversations.find((c) => c.user_id === selectedUserId)
  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0)

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="h-[calc(100vh-5rem)] flex flex-col gap-4">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support Chat</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            {totalUnread > 0 && (
              <span className="ml-2 text-amber-500 font-medium">· {totalUnread} unread</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1">
            <Users className="h-3 w-3" />
            {conversations.length}
          </Badge>
          {totalUnread > 0 && (
            <Badge className="bg-amber-500 text-white text-xs">{totalUnread} new</Badge>
          )}
        </div>
      </motion.div>

      {/* Main panel */}
      <motion.div variants={item} className="flex flex-1 gap-4 min-h-0">
        {/* Conversations list */}
        <Card className="w-72 shrink-0 flex flex-col min-h-0">
          <CardHeader className="pb-2 pt-4 px-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-0">
            <ScrollArea className="h-full">
              {convsLoading ? (
                <div className="p-3 space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-2 px-4">
                  <MessageCircle className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">No conversations yet</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.user_id}
                      onClick={() => setSelectedUserId(conv.user_id)}
                      className={cn(
                        'w-full text-left rounded-lg px-3 py-2.5 transition-colors',
                        selectedUserId === conv.user_id
                          ? 'bg-emerald-500/10 border border-emerald-500/20'
                          : 'hover:bg-muted/60'
                      )}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">
                            {conv.email ?? conv.user_id.slice(0, 8) + '...'}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {conv.last_message}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {formatRelativeTime(conv.last_at)}
                          </p>
                        </div>
                        {conv.unread > 0 && (
                          <span className="shrink-0 h-5 w-5 rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center justify-center">
                            {conv.unread > 9 ? '9+' : conv.unread}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message panel */}
        <Card className="flex-1 flex flex-col min-h-0">
          {!selectedUserId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
              <MessageCircle className="h-12 w-12 text-muted-foreground/20" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">No conversation selected</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Pick a user from the list to view their messages</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-emerald-600">
                      {(selectedConv?.email?.[0] ?? selectedUserId[0]).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-semibold truncate">
                      {selectedConv?.email ?? selectedUserId}
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
                      Active conversation
                    </p>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-3">
                {msgsLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 gap-2">
                    <p className="text-xs text-muted-foreground">No messages yet</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          'flex flex-col max-w-[70%] gap-0.5',
                          msg.sender === 'admin' ? 'self-end items-end' : 'self-start items-start'
                        )}
                      >
                        <div
                          className={cn(
                            'px-3 py-2 rounded-2xl text-sm leading-snug',
                            msg.sender === 'admin'
                              ? 'bg-emerald-500 text-white rounded-br-sm'
                              : 'bg-muted text-foreground rounded-bl-sm'
                          )}
                        >
                          {msg.message}
                        </div>
                        <span className="text-[10px] text-muted-foreground px-1">
                          {msg.sender === 'admin' ? 'You · ' : 'User · '}
                          {formatRelativeTime(msg.created_at)}
                        </span>
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Reply input */}
              <div className="flex items-center gap-2 border-t border-border px-4 py-3">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a reply..."
                  className="text-sm h-9 border-0 bg-muted/50 focus-visible:ring-1"
                  disabled={replyMutation.isPending}
                />
                <Button
                  size="icon"
                  className="h-9 w-9 shrink-0 bg-emerald-500 hover:bg-emerald-600"
                  onClick={() => replyMutation.mutate()}
                  disabled={!replyText.trim() || replyMutation.isPending}
                >
                  {replyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </motion.div>
  )
}
