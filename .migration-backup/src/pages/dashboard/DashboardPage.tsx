import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  Activity,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getDashboardStats, getBalanceHistory, getMonthlySpending } from '@/services/dashboard.service'
import { getRecentTransactions } from '@/services/wallet.service'
import { getActiveAnnouncements } from '@/services/announcement.service'
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/formatters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const firstName = profile?.first_name || 'User'

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => getDashboardStats(user!.id),
    enabled: !!user?.id,
  })

  const { data: transactions } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: () => getRecentTransactions(user!.id, 5),
    enabled: !!user?.id,
  })

  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: getActiveAnnouncements,
  })

  const { data: balanceHistory } = useQuery({
    queryKey: ['balance-history'],
    queryFn: () => getBalanceHistory(user!.id, 30),
    enabled: !!user?.id,
  })

  const { data: monthlySpending } = useQuery({
    queryKey: ['monthly-spending'],
    queryFn: () => getMonthlySpending(user!.id),
    enabled: !!user?.id,
  })

  const statCards = [
    {
      title: 'Wallet Balance',
      value: stats?.walletBalance || 0,
      icon: Wallet,
      color: 'emerald',
      format: (v: number) => formatCurrency(v),
      href: ROUTES.WALLET,
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: TrendingUp,
      color: 'blue',
      format: (v: number) => v.toLocaleString(),
    },
    {
      title: 'Pending Orders',
      value: stats?.pendingOrders || 0,
      icon: Clock,
      color: 'amber',
      format: (v: number) => v.toLocaleString(),
    },
    {
      title: 'Completed',
      value: stats?.completedOrders || 0,
      icon: CheckCircle2,
      color: 'green',
      format: (v: number) => v.toLocaleString(),
    },
  ]

  const quickActions = [
    { name: 'Add Funds', icon: Plus, href: ROUTES.WALLET },
    { name: 'View Orders', icon: Activity, href: '/orders', disabled: true },
    { name: 'Referrals', icon: TrendingUp, href: ROUTES.REFERRAL },
    { name: 'Support', icon: Bell, href: '/support', disabled: true },
  ]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={item}>
        <div className="mb-2">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {firstName}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your account today.
          </p>
        </div>
      </motion.div>

      {announcements && announcements.length > 0 && (
        <motion.div variants={item}>
          {announcements.slice(0, 1).map((announcement) => (
            <div
              key={announcement.id}
              className="rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{announcement.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-1">{announcement.content}</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">
                New
              </Badge>
            </div>
          ))}
        </motion.div>
      )}

      <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} to={stat.href || '#'}>
            <Card className="hover:border-emerald-500/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`h-8 w-8 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center`}>
                  <stat.icon className={`h-4 w-4 text-${stat.color}-500`} />
                </div>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold text-foreground">
                    {stat.format(stat.value)}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Balance Overview</CardTitle>
              <CardDescription>Your wallet balance over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {balanceHistory && balanceHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={balanceHistory}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => formatDate(value, 'MMM d')}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Balance']}
                      labelFormatter={(label) => formatDate(label, 'MMM d, yyyy')}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No balance history yet
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Frequently used actions</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.disabled ? '#' : action.href}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all ${
                    action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <action.icon className="h-5 w-5 text-emerald-500" />
                  </div>
                  <span className="text-sm font-medium">{action.name}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest wallet activity</CardDescription>
              </div>
              <Link to={ROUTES.WALLET}>
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {transactions && transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                          tx.type === 'credit' || tx.type === 'bonus' || tx.type === 'refund'
                            ? 'bg-emerald-500/10'
                            : 'bg-red-500/10'
                        }`}>
                          {tx.type === 'credit' || tx.type === 'bonus' || tx.type === 'refund' ? (
                            <ArrowDownRight className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{tx.description || tx.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(tx.created_at)}
                          </p>
                        </div>
                      </div>
                      <span className={`font-medium ${
                        tx.type === 'credit' || tx.type === 'bonus' || tx.type === 'refund'
                          ? 'text-emerald-500'
                          : 'text-red-500'
                      }`}>
                        {tx.type === 'credit' || tx.type === 'bonus' || tx.type === 'refund' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No recent transactions
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle>Monthly Spending</CardTitle>
              <CardDescription>Your spending patterns over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              {monthlySpending && monthlySpending.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlySpending}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => formatDate(value, 'MMM')}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Spent']}
                    />
                    <Bar
                      dataKey="value"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No spending data yet
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
