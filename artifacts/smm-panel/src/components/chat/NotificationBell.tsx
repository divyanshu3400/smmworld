import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, Info, AlertTriangle, ShoppingCart, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  subscribeToNotifications,
} from '@/services/notification.service'
import type { Notification } from '@/types/database'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/formatters'

function NotifIcon({ type }: { type: string }) {
  const cls = 'h-4 w-4 shrink-0'
  if (type === 'success') return <ShoppingCart className={cn(cls, 'text-emerald-500')} />
  if (type === 'warning') return <AlertTriangle className={cn(cls, 'text-yellow-500')} />
  if (type === 'error') return <AlertTriangle className={cn(cls, 'text-red-500')} />
  if (type === 'announcement') return <MessageCircle className={cn(cls, 'text-purple-500')} />
  return <Info className={cn(cls, 'text-blue-500')} />
}

export default function NotificationBell() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => getUnreadCount(user!.id),
    enabled: !!user,
    refetchInterval: 30000,
  })

  const { data: notifData } = useQuery({
    queryKey: ['notifications-dropdown'],
    queryFn: () => getNotifications(user!.id, undefined, 1, 8),
    enabled: !!user,
    staleTime: 30 * 1000,
  })

  const notifications: Notification[] = notifData?.data ?? []

  const markAllMutation = useMutation({
    mutationFn: () => markAllAsRead(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] })
    },
  })

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!user) return
    const channel = subscribeToNotifications(user.id, () => {
      queryClient.invalidateQueries({ queryKey: ['unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] })
    })
    return () => { channel.unsubscribe() }
  }, [user?.id])

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-emerald-500 text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-foreground" />
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <span className="h-5 min-w-5 px-1 rounded-full bg-emerald-500 text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-emerald-500 hover:text-emerald-600 px-2"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification list */}
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
              <Bell className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">You're all caught up!</p>
            </div>
          ) : (
            <div>
              {notifications.map((n) => {
                const isUnread = !n.read_at
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 transition-colors',
                      isUnread ? 'bg-emerald-500/5' : 'hover:bg-muted/50'
                    )}
                  >
                    <div className="mt-0.5">
                      <NotifIcon type={n.type ?? 'system'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className={cn('text-xs font-medium leading-snug', isUnread ? 'text-foreground' : 'text-muted-foreground')}>
                          {n.title}
                        </p>
                        {isUnread && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 mt-1" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{formatRelativeTime(n.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-border px-4 py-2.5">
            <button
              className="text-xs text-emerald-500 hover:underline w-full text-center"
              onClick={() => {
                window.location.href = '/notifications'
              }}
            >
              View all notifications
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
