import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Package, Search, ListFilter as Filter, ChevronLeft, ChevronRight, RefreshCw, X, ShoppingCart, Loader as Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getServices, getCategories, type SMMService } from '@/services/smm-api.service'
import { createOrder, getUserOrders, syncOrderStatus, getOrderStats, cancelOrder } from '@/services/orders.service'
import { getWallet } from '@/services/wallet.service'
import { formatCurrencyByCode, type CurrencyCode } from '@/lib/currency'
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatRelativeTime } from '@/lib/formatters'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import type { Order } from '@/types/database'
import { detectPlatformFromCategory } from '@/lib/platformDetector'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

function Separator({ className }: { className?: string }) {
  return <div className={`h-px bg-border ${className || ''}`} />
}

export default function OrdersPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedService, setSelectedService] = useState<SMMService | null>(null)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [orderLink, setOrderLink] = useState('')
  const [orderQuantity, setOrderQuantity] = useState('')
  const [orderPage, setOrderPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const { currency } = useCurrency()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["smm-categories"],
    queryFn: getCategories,
    staleTime: 30 * 60 * 1000,
  });

  const platform = detectPlatformFromCategory(
    selectedCategory === "all" ? undefined : selectedCategory
  );

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["smm-services", selectedCategory, debouncedSearch, platform],
    queryFn: () =>
      getServices({
        category: selectedCategory === "all" ? undefined : selectedCategory,
        search: debouncedSearch || undefined,
        platform,
      }),
    enabled: selectedCategory !== "all" && selectedCategory !== "", // ← only fetch when category selected
    staleTime: 5 * 60 * 1000,
  });

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

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => getWallet(user!.id),
    enabled: !!user?.id,
  })

  const calculatePrice = (): number => {
    if (!selectedService || !orderQuantity) return 0;
    const qty = Number(orderQuantity);
    const rate = Number(selectedService.rate);
    return Number(((rate * qty) / 1000).toFixed(4));
  };

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedService || !orderLink || !orderQuantity) {
        throw new Error('Please fill all fields')
      }

      const quantity = parseInt(orderQuantity)
      const min = parseInt(selectedService.min)
      const max = parseInt(selectedService.max)

      if (isNaN(quantity) || quantity < min || quantity > max) {
        throw new Error(`Quantity must be between ${min.toLocaleString()} and ${max.toLocaleString()}`)
      }

      const price = calculatePrice()

      if (wallet && Number(wallet.balance) < price) {
        throw new Error('Insufficient balance. Please add funds to your wallet.')
      }

      return createOrder(
        user!.id,
        {
          serviceId: selectedService.service,
          serviceName: selectedService.name,
          platform: platform,
          link: orderLink,
          quantity,
        },
        currency
      )
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || 'Order failed')
        return
      }
      toast.success('Order placed successfully!')
      setOrderDialogOpen(false)
      setOrderLink('')
      setOrderQuantity('')
      setSelectedService(null)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      queryClient.invalidateQueries({ queryKey: ['order-stats'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const syncOrderMutation = useMutation({
    mutationFn: syncOrderStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId, user!.id),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || 'Cancel failed')
        return
      }
      toast.success('Order cancelled and refunded')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      queryClient.invalidateQueries({ queryKey: ['order-stats'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const handlePlaceOrder = (service: SMMService) => {
    setSelectedService(service)
    setOrderQuantity(service.min)
    setOrderDialogOpen(true)
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

      {/* Stats */}
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

      {/* New Order Section */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              New Order
            </CardTitle>
            <CardDescription>Select a service, enter your link, and place your order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  className="pl-9 pr-8 h-9 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                disabled={categoriesLoading}
              >
                <SelectTrigger className="w-96 h-9 text-sm">
                  <Filter className="mr-2 h-3.5 w-3.5 shrink-0" />
                  {categoriesLoading ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    <SelectValue placeholder="All Categories" />
                  )}
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Results count */}
            {!servicesLoading && (
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">
                  {services.length} service{services.length !== 1 ? "s" : ""}
                  {debouncedSearch && ` matching "${debouncedSearch}"`}
                </p>
                {(debouncedSearch || selectedCategory !== "all") && (
                  <button
                    onClick={() => { setSearch(""); setSelectedCategory("all"); }}
                    className="text-xs text-emerald-500 hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
            {servicesLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : selectedCategory === "all" || selectedCategory === "" ? (
              <div className="col-span-full flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Filter className="h-8 w-8 mb-3 opacity-40" />
                <p className="text-sm font-medium">Select a category to view services</p>
                <p className="text-xs mt-1 opacity-60">Choose a platform category from the dropdown above</p>
              </div>
            ) : services.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Search className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No services found</p>
                {debouncedSearch && (
                  <button
                    onClick={() => setSearch("")}
                    className="mt-2 text-xs text-emerald-500 hover:underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-96 overflow-y-auto pr-2">
                {services.map((service) => (
                  <div
                    key={service.service}
                    className="flex flex-col justify-between p-3 rounded-lg border border-border hover:border-emerald-500/50 transition-colors group cursor-pointer"
                    onClick={() => handlePlaceOrder(service)}
                  >
                    <div className="mb-2">
                      <div className="text-xs text-muted-foreground mb-1">
                        ID: {service.service}
                      </div>
                      <div className="text-sm font-medium line-clamp-2 group-hover:text-emerald-500 transition-colors">
                        {service.name}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="font-semibold text-emerald-500">
                        ₹{Number(service.rate).toFixed(4)}/1K
                      </span>
                      <span className="text-muted-foreground">
                        {Number(service.min).toLocaleString()} – {Number(service.max).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

        </Card>
      </motion.div>

      {/* Orders History */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
            <CardDescription>Track and manage your orders</CardDescription>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
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
                        <TableHead className="w-24">Actions</TableHead>
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
                          <TableCell>
                            {formatCurrencyByCode(order.price, order.currency as CurrencyCode)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatRelativeTime(order.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => syncOrderMutation.mutate(order)}
                                title="Sync status"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              {(order.status === 'pending' || order.status === 'processing') && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-600"
                                  onClick={() => {
                                    if (confirm('Cancel this order?')) {
                                      cancelOrderMutation.mutate(order.id)
                                    }
                                  }}
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

      {/* Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Order</DialogTitle>
            <DialogDescription>{selectedService?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Link</label>
              <Input
                placeholder="https://instagram.com/username"
                value={orderLink}
                onChange={(e) => setOrderLink(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <Input
                type="number"
                min={selectedService?.min}
                max={selectedService?.max}
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Min: {selectedService ? parseInt(selectedService.min).toLocaleString() : 0}
                {' | '}
                Max: {selectedService ? parseInt(selectedService.max).toLocaleString() : 0}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Rate per 1,000:</span>
                <span className="font-medium">
                  {selectedService ? parseFloat(selectedService.rate) : 0}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Your balance:</span>
                <span className="font-medium">
                  {wallet ? formatCurrencyByCode(wallet.balance, wallet.currency as CurrencyCode) : '$0.00'}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="font-medium">Total:</span>
                <span className="font-bold text-emerald-500">
                  {calculatePrice()}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-emerald-500 hover:bg-emerald-600"
              onClick={() => createOrderMutation.mutateAsync().catch(() => { })}
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
              ) : (
                'Place Order'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
