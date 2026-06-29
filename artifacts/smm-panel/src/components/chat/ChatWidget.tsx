import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/useAuth'
import {
    getMessages,
    sendMessage,
    getUnreadChatCount,
    subscribeToChatMessages,
    type ChatMessage,
} from '@/services/chat.service'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/formatters'

export default function ChatWidget() {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [input, setInput] = useState('')
    const bottomRef = useRef<HTMLDivElement>(null)

    const { data: unreadCount = 0 } = useQuery({
        queryKey: ['chat-unread'],
        queryFn: getUnreadChatCount,
        enabled: !!user,
        refetchInterval: 30000,
    })

    const { data, isLoading } = useQuery({
        queryKey: ['chat-messages'],
        queryFn: () => getMessages(),
        enabled: !!user && open,
        staleTime: 0,
    })

    const messages: ChatMessage[] = data?.data ?? []

    const sendMutation = useMutation({
        mutationFn: sendMessage,
        onSuccess: (newMsg) => {
            queryClient.setQueryData(['chat-messages'], (old: typeof data) => ({
                ...(old ?? { total: 0, hasMore: false }),
                data: [...(old?.data ?? []), newMsg],
            }))
            setInput('')
        },
    })

    // Scroll to bottom on open or new messages
    useEffect(() => {
        if (open) {
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        }
    }, [open, messages.length])

    // Supabase Realtime for incoming admin messages
    useEffect(() => {
        if (!user) return
        const channel = subscribeToChatMessages(user.id, (msg) => {
            if (msg.sender === 'admin') {
                queryClient.setQueryData(['chat-messages'], (old: typeof data) => ({
                    ...(old ?? { total: 0, hasMore: false }),
                    data: [...(old?.data ?? []), msg],
                }))
                queryClient.invalidateQueries({ queryKey: ['chat-unread'] })
            }
        })
        return () => { channel.unsubscribe() }
    }, [user?.id])

    // Invalidate unread when opened
    useEffect(() => {
        if (open) {
            queryClient.invalidateQueries({ queryKey: ['chat-unread'] })
            queryClient.invalidateQueries({ queryKey: ['chat-messages'] })
        }
    }, [open])

    if (!user) return null

    const handleSend = () => {
        const msg = input.trim()
        if (!msg || sendMutation.isPending) return
        sendMutation.mutate(msg)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <>
            {/* Floating button */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
                {/* Chat panel */}
                {open && (
                    <div className="w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-emerald-500 text-white">
                            <div>
                                <p className="font-semibold text-sm">Support Chat</p>
                                <p className="text-[11px] opacity-80">We typically reply within minutes</p>
                            </div>
                            <button onClick={() => setOpen(false)} className="opacity-80 hover:opacity-100 transition-opacity">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Messages */}
                        <ScrollArea className="flex-1 h-72 px-3 py-3">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-32">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-32 text-center gap-2">
                                    <MessageCircle className="h-8 w-8 text-muted-foreground/40" />
                                    <p className="text-xs text-muted-foreground">Send a message to start the conversation</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={cn('flex flex-col max-w-[80%] gap-0.5', msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start')}
                                        >
                                            <div
                                                className={cn(
                                                    'px-3 py-2 rounded-2xl text-sm leading-snug',
                                                    msg.sender === 'user'
                                                        ? 'bg-emerald-500 text-white rounded-br-sm'
                                                        : 'bg-muted text-foreground rounded-bl-sm'
                                                )}
                                            >
                                                {msg.message}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground px-1">
                                                {msg.sender === 'admin' ? 'Support · ' : ''}{formatRelativeTime(msg.created_at)}
                                            </span>
                                        </div>
                                    ))}
                                    <div ref={bottomRef} />
                                </div>
                            )}
                        </ScrollArea>

                        {/* Input */}
                        <div className="flex items-center gap-2 border-t border-border px-3 py-2.5">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                className="text-sm h-9 border-0 bg-muted/50 focus-visible:ring-1"
                                disabled={sendMutation.isPending}
                            />
                            <Button
                                size="icon"
                                className="h-9 w-9 shrink-0 bg-emerald-500 hover:bg-emerald-600"
                                onClick={handleSend}
                                disabled={!input.trim() || sendMutation.isPending}
                            >
                                {sendMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Toggle button */}
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="relative h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center"
                >
                    {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
                    {!open && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </div>
        </>
    )
}
