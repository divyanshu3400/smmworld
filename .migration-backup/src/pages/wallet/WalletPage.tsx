import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getWallet, getTransactions } from '@/services/wallet.service'
import { formatCurrency, formatRelativeTime } from '@/lib/formatters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TRANSACTION_TYPES } from '@/lib/constants'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function WalletPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [type, setType] = useState<string>('all')
  const pageSize = 10

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => getWallet(user!.id),
    enabled: !!user?.id,
  })

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', page, type],
    queryFn: () =>
      getTransactions(user!.id, {
        type: type as 'credit' | 'debit' | 'refund' | 'bonus' | 'purchase' | 'all' | undefined,
      }, page, pageSize),
    enabled: !!user?.id,
  })

  const statCards = [
    {
      title: 'Total Credits',
      value: formatCurrency(0),
      icon: ArrowDownRight,
      color: 'emerald',
    },
    {
      title: 'Total Debits',
      value: formatCurrency(0),
      icon: ArrowUpRight,
      color: 'red',
    },
    {
      title: 'Transactions',
      value: transactions?.total || 0,
      icon: Wallet,
      color: 'blue',
    },
  ]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold text-foreground">Wallet</h1>
        <p className="text-muted-foreground">Manage your funds and view transaction history</p>
      </motion.div>

      <motion.div variants={item}>
        <Card className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm font-medium">Available Balance</p>
                {walletLoading ? (
                  <Skeleton className="h-12 w-32 bg-white/20" />
                ) : (
                  <h2 className="text-4xl font-bold mt-1">
                    {formatCurrency(wallet?.balance || 0, wallet?.currency || 'USD')}
                  </h2>
                )}
                <p className="text-white/70 text-sm mt-2">
                  {wallet?.currency || 'USD'} Wallet
                </p>
              </div>
              <div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center">
                <Wallet className="h-10 w-10" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div
                  className={`h-10 w-10 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center`}
                >
                  <stat.icon className={`h-5 w-5 text-${stat.color}-500`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Your recent wallet transactions</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {Object.entries(TRANSACTION_TYPES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : transactions?.data && transactions.data.length > 0 ? (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.data.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`${
                                tx.type === 'credit' || tx.type === 'bonus' || tx.type === 'refund'
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : tx.type === 'debit' || tx.type === 'purchase'
                                  ? 'bg-red-500/10 text-red-500'
                                  : 'bg-blue-500/10 text-blue-500'
                              }`}
                            >
                              {TRANSACTION_TYPES[tx.type]?.label || tx.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{tx.description || '-'}</p>
                              {tx.reference_id && (
                                <p className="text-xs text-muted-foreground">{tx.reference_id}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-medium ${
                                tx.type === 'credit' || tx.type === 'bonus' || tx.type === 'refund'
                                  ? 'text-emerald-500'
                                  : 'text-red-500'
                              }`}
                            >
                              {tx.type === 'credit' || tx.type === 'bonus' || tx.type === 'refund'
                                ? '+'
                                : '-'}
                              {formatCurrency(tx.amount)}
                            </span>
                          </TableCell>
                          <TableCell>{formatCurrency(tx.balance_after)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatRelativeTime(tx.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * pageSize + 1} to{' '}
                    {Math.min(page * pageSize, transactions.total)} of {transactions.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!transactions.hasMore}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No transactions yet</h3>
                <p className="text-muted-foreground">
                  Your transaction history will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
