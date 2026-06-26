import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Search,
  Filter,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { getAdminOrders, syncAdminOrder, cancelAdminOrder } from '@/services/admin.service'
import { formatCurrency, formatRelativeTime, formatDateTime } from '@/lib/formatters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
const STATUS_META: Record<string, { color: string; bg: string; border: string; Icon: React.ElementType }> = {
  pending: { color: '#f59e0b', bg: '#f59e0b15', border: '#f59e0b40', Icon: Clock },
  processing: { color: '#3b82f6', bg: '#3b82f615', border: '#3b82f640', Icon: Activity },
  in_progress: { color: '#6366f1', bg: '#6366f115', border: '#6366f140', Icon: Activity },
  completed: { color: '#10b981', bg: '#10b98115', border: '#10b98140', Icon: CheckCircle2 },
  partial: { color: '#f97316', bg: '#f9731615', border: '#f9731640', Icon: AlertCircle },
  cancelled: { color: '#ef4444', bg: '#ef444415', border: '#ef444440', Icon: XCircle },
  refunded: { color: '#8b5cf6', bg: '#8b5cf615', border: '#8b5cf640', Icon: RefreshCw },
}

const STATUSES = ['all', 'pending', 'processing', 'in_progress', 'completed', 'partial', 'cancelled', 'refunded']

export default function AdminOrdersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const dSearch = search

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-orders', page, status, dSearch],
    queryFn: () => getAdminOrders(page, 20, status, dSearch),
    placeholderData: (prev) => prev,
  })

  const syncMutation = useMutation({
    mutationFn: syncAdminOrder,
    onSuccess: (res, orderId) => {
      toast.success(`Status updated: ${res.status}`)
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const cancelMutation = useMutation({
    mutationFn: cancelAdminOrder,
    onSuccess: () => {
      toast.success('Order cancelled & refunded')
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const totalPages = data ? Math.ceil(data.total / 20) : 1

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Order Management</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {data?.total ? `${data.total.toLocaleString()} total orders` : 'All platform orders'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-orders'] })}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        <Card>
          {/* Filters */}
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search service name or order ID…"
                  className="pl-9 h-9"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                />
              </div>
              <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
                <SelectTrigger className="w-full sm:w-44 h-9">
                  <Filter className="mr-2 h-3.5 w-3.5" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s === 'all' ? 'All Statuses' : s.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : data?.orders && data.orders.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead className="bg-muted/40 border-b border-border">
                      <tr>
                        {['Order ID', 'User', 'Service', 'Qty', 'Price', 'Status', 'Date', 'Actions'].map((h) => (
                          <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3 first:pl-6 last:pr-6">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.orders.map((order) => {
                        const meta = STATUS_META[order.status] || STATUS_META['pending']
                        const StatusIcon = meta.Icon
                        const isActive = ['pending', 'processing', 'in_progress'].includes(order.status)

                        return (
                          <tr key={order.id} className="hover:bg-accent/20 transition-colors group">
                            <td className="px-4 py-3 pl-6">
                              <div className="font-mono text-xs">{order.external_order_id || '—'}</div>
                              <div className="text-xs text-muted-foreground">{order.id.slice(0, 8)}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs font-medium max-w-[100px] truncate">{order.user_name}</div>
                              <div className="text-xs text-muted-foreground font-mono">{order.user_id.slice(0, 8)}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="max-w-[180px] truncate font-medium">{order.service_name}</div>
                              <div className="text-xs text-muted-foreground">
                                <a href={order.link} target="_blank" rel="noreferrer" className="hover:text-emerald-500 transition-colors flex items-center gap-1 mt-0.5">
                                  <span className="truncate max-w-[140px]">{order.link}</span>
                                  <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                                </a>
                              </div>
                            </td>
                            <td className="px-4 py-3 tabular-nums">{order.quantity.toLocaleString()}</td>
                            <td className="px-4 py-3 font-medium tabular-nums">${order.price_usd?.toFixed(4)}</td>
                            <td className="px-4 py-3">
                              <Badge
                                variant="outline"
                                className="gap-1 text-xs whitespace-nowrap"
                                style={{
                                  borderColor: meta.border,
                                  color: meta.color,
                                  backgroundColor: meta.bg,
                                }}
                              >
                                <StatusIcon className="h-3 w-3" />
                                {order.status.replace('_', ' ')}
                              </Badge>
                              {order.remains !== null && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {order.remains.toLocaleString()} left
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                              {formatRelativeTime(order.created_at)}
                            </td>
                            <td className="px-4 py-3 pr-6">
                              <div className="flex items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => syncMutation.mutate(order.id)}
                                      disabled={syncMutation.isPending && syncMutation.variables === order.id}
                                    >
                                      <RefreshCw className={`h-3.5 w-3.5 ${syncMutation.isPending && syncMutation.variables === order.id ? 'animate-spin' : ''}`} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Sync status</TooltipContent>
                                </Tooltip>
                                {isActive && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                        onClick={() => {
                                          if (confirm(`Cancel order for ${order.user_name}?`)) {
                                            cancelMutation.mutate(order.id)
                                          }
                                        }}
                                        disabled={cancelMutation.isPending}
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Cancel & refund</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of {data.total.toLocaleString()} orders
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                      {page} / {totalPages}
                    </span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                <Activity className="mx-auto h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">No orders found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  )
}
