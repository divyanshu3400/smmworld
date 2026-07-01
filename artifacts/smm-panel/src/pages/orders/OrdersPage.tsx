import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Package, ChevronLeft, ChevronRight, RefreshCw, X, ShoppingCart, Eye, RotateCcw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { type SMMService, cancelOrder, getServiceById } from '@/services/smm-api.service'
import { getUserOrders, syncOrderStatus, getOrderStats } from '@/services/orders.service'
import { formatCurrencyByCode, type CurrencyCode } from '@/lib/currency'
import { formatRelativeTime } from '@/lib/formatters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import type { Order } from '@/types/database'
import FrequentServices from '@/components/orders/FrquestServices'
import OrderWidget, { type OrderWidgetHandle } from '@/components/orders/OrderWidget'
import OrderDetailsDialog from '@/components/orders/OrderDetailsDialog'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export default function OrdersPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [orderPage, setOrderPage] = useState(1)
  const [detailsOrderId, setDetailsOrderId] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const orderWidgetRef = useRef<OrderWidgetHandle>(null)

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', orderPage],
    queryFn: () => getUserOrders(user!.id, orderPage, 10),
    enabled: !!user?.id,
  })

  const { data: orderStats } = useQuery({
    queryKey: ['order-stats'],
    queryFn: () => getOrderStats(user!.id),
    enabled: !!user?.id,
  })

  const syncOrderMutation = useMutation({
    mutationFn: syncOrderStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onSuccess: (result) => {
      if (!result.success) { toast.error('Cancel failed'); return }
      toast.success('Order cancelled and refunded')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      queryClient.invalidateQueries({ queryKey: ['order-stats'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const buyAgainMutation = useMutation({
    mutationFn: async (order: Order) => {
      const service = await getServiceById(order.service_id)
      if (!service) throw new Error('This service is no longer available')
      return { service, order }
    },
    onSuccess: ({ service, order }) => {
      orderWidgetRef.current?.prefillOrder(service, order.link, String(order.quantity))
      document.getElementById('order-widget-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      toast.success('Loaded into the order form — review and submit')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const handleQuickOrder = (service: SMMService, prefillLink: string) => {
    orderWidgetRef.current?.prefillOrder(service, prefillLink, service.min)
    document.getElementById('order-widget-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const getStatusColor = (status: Order['status']) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      processing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      partial: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
      refunded: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    }
    return colors[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold text-foreground">Orders</h1>
        <p className="text-muted-foreground">Place and track your social media orders</p>
      </motion.div>

      <motion.div variants={item} className="grid gap-4 md:grid-cols-5">
        {[
          { label: 'Total Orders', value: orderStats?.total || 0 },
          { label: 'Pending', value: orderStats?.pending || 0 },
          { label: 'Processing', value: orderStats?.processing || 0 },
          { label: 'Completed', value: orderStats?.completed || 0 },
          { label: 'Cancelled', value: orderStats?.cancelled || 0 },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <motion.div variants={item} id="order-widget-anchor">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              New Order
            </CardTitle>
            <CardDescription>Select a service, enter your link, and place your order</CardDescription>
          </CardHeader>
          <CardContent>
            <FrequentServices totalOrders={ordersData?.total ?? 0} onQuickOrder={handleQuickOrder} />
            <OrderWidget ref={orderWidgetRef} />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
            <CardDescription>Track and manage your orders</CardDescription>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : ordersData?.data && ordersData.data.length > 0 ? (
              <>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-32">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordersData.data.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">
                            {order.external_order_id || order.id.slice(0, 8)}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px] truncate text-sm">{order.service_name}</div>
                          </TableCell>
                          <TableCell>{order.quantity.toLocaleString()}</TableCell>
                          <TableCell>{formatCurrencyByCode(order.price, order.currency as CurrencyCode)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(order.status)}>{order.status}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatRelativeTime(order.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost" size="icon" className="h-8 w-8"
                                onClick={() => { setDetailsOrderId(order.id); setDetailsOpen(true) }}
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost" size="icon" className="h-8 w-8"
                                onClick={() => syncOrderMutation.mutate(order)}
                                title="Sync status"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              {['completed', 'cancelled', 'partial'].includes(order.status) && (
                                <Button
                                  variant="ghost" size="icon" className="h-8 w-8 text-emerald-500 hover:text-emerald-600"
                                  onClick={() => buyAgainMutation.mutate(order)}
                                  disabled={buyAgainMutation.isPending}
                                  title="Buy again"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              )}
                              {(order.status === 'pending' || order.status === 'processing') && (
                                <Button
                                  variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600"
                                  onClick={() => { if (confirm('Cancel this order?')) cancelOrderMutation.mutate(order.id) }}
                                  title="Cancel order"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(orderPage - 1) * 10 + 1}–{Math.min(orderPage * 10, ordersData.total)} of {ordersData.total}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={orderPage === 1} onClick={() => setOrderPage(orderPage - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={!ordersData.hasMore} onClick={() => setOrderPage(orderPage + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="mx-auto h-12 w-12 mb-4" />
                <p>No orders yet. Place your first order above!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <OrderDetailsDialog
        orderId={detailsOrderId}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        getStatusColor={getStatusColor}
      />
    </motion.div>
  )
}