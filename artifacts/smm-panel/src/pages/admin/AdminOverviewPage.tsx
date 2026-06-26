import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  Users,
  Activity,
  ShoppingCart,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { getAdminOverview } from '@/services/admin.service'
import { formatCurrency, formatRelativeTime, formatDate } from '@/lib/formatters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from 'react-router-dom'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  in_progress: '#6366f1',
  completed: '#10b981',
  partial: '#f97316',
  cancelled: '#ef4444',
  refunded: '#8b5cf6',
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  pending: Clock,
  processing: Activity,
  in_progress: Activity,
  completed: CheckCircle2,
  partial: AlertCircle,
  cancelled: XCircle,
  refunded: ArrowDownRight,
}

export default function AdminOverviewPage() {
  const queryClient = useQueryClient()

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: getAdminOverview,
    refetchInterval: 60 * 1000,
  })

  const statCards = [
    {
      title: 'Provider Balance',
      value: data?.providerBalance?.balance
        ? parseFloat(data.providerBalance.balance).toFixed(2)
        : '—',
      prefix: '$',
      icon: DollarSign,
      color: 'emerald',
      description: 'WorldOfSMM account',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(data?.totalRevenue || 0),
      prefix: '',
      icon: TrendingUp,
      color: 'blue',
      description: 'All-time purchases',
    },
    {
      title: 'Total Users',
      value: (data?.totalUsers || 0).toLocaleString(),
      prefix: '',
      icon: Users,
      color: 'purple',
      description: `${data?.ordersToday || 0} orders today`,
    },
    {
      title: 'Active Orders',
      value: (data?.activeOrders || 0).toLocaleString(),
      prefix: '',
      icon: Activity,
      color: 'amber',
      description: `${(data?.totalOrders || 0).toLocaleString()} total`,
    },
  ]

  const statusChartData = Object.entries(data?.ordersByStatus || {}).map(([status, count]) => ({
    status: status.replace('_', ' '),
    count,
    fill: STATUS_COLORS[status] || '#6b7280',
  }))

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Platform overview &amp; live metrics</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className={`hover:border-${stat.color}-500/40 transition-colors`}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-9 w-9 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-5 w-5 text-${stat.color}-500`} />
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-7 w-20 mb-1" />
                ) : (
                  <div className="text-xl sm:text-2xl font-bold tabular-nums">
                    {stat.prefix}{stat.value}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue chart */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">Revenue (Last 30 Days)</CardTitle>
              <CardDescription>Daily purchase totals</CardDescription>
            </CardHeader>
            <CardContent className="h-56 sm:h-64">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : data?.revenueChart && data.revenueChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenueChart}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => formatDate(v, 'MMM d')}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `$${v}`}
                      className="text-muted-foreground"
                      width={50}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }}
                      formatter={(v: number) => [`$${v.toFixed(4)}`, 'Revenue']}
                      labelFormatter={(l) => formatDate(l, 'MMM d, yyyy')}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No revenue data yet</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Orders by status */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">Orders by Status</CardTitle>
              <CardDescription>Current distribution</CardDescription>
            </CardHeader>
            <CardContent className="h-56 sm:h-64">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="status" type="category" tick={{ fontSize: 10 }} width={70} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {statusChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No order data yet</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Orders */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base sm:text-lg">Recent Orders</CardTitle>
              <CardDescription>Latest 10 across all users</CardDescription>
            </div>
            <Link to="/admin/orders">
              <Button variant="ghost" size="sm" className="gap-1 text-xs sm:text-sm">
                View all <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : data?.recentOrders && data.recentOrders.length > 0 ? (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs text-muted-foreground font-medium pb-2 pl-4 sm:pl-0">Order</th>
                      <th className="text-left text-xs text-muted-foreground font-medium pb-2">Service</th>
                      <th className="text-left text-xs text-muted-foreground font-medium pb-2 hidden sm:table-cell">Price</th>
                      <th className="text-left text-xs text-muted-foreground font-medium pb-2">Status</th>
                      <th className="text-left text-xs text-muted-foreground font-medium pb-2 hidden md:table-cell">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.recentOrders.map((order) => {
                      const StatusIcon = STATUS_ICONS[order.status] || Activity
                      return (
                        <tr key={order.id} className="hover:bg-accent/30 transition-colors">
                          <td className="py-3 pl-4 sm:pl-0 pr-2">
                            <div className="font-mono text-xs text-muted-foreground">
                              {order.external_order_id || order.id.slice(0, 8)}
                            </div>
                          </td>
                          <td className="py-3 pr-2">
                            <div className="max-w-[160px] sm:max-w-[220px] truncate">{order.service_name}</div>
                            <div className="text-xs text-muted-foreground">{order.quantity.toLocaleString()} units</div>
                          </td>
                          <td className="py-3 pr-2 hidden sm:table-cell font-medium">
                            ${order.price_usd?.toFixed(4)}
                          </td>
                          <td className="py-3 pr-2">
                            <Badge
                              variant="outline"
                              className="gap-1 text-xs"
                              style={{
                                borderColor: STATUS_COLORS[order.status] + '40',
                                color: STATUS_COLORS[order.status],
                                backgroundColor: STATUS_COLORS[order.status] + '15',
                              }}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {order.status}
                            </Badge>
                          </td>
                          <td className="py-3 text-xs text-muted-foreground hidden md:table-cell">
                            {formatRelativeTime(order.created_at)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground">
                <ShoppingCart className="mx-auto h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No orders yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
