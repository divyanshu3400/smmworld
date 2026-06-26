import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  CreditCard,
  IndianRupee,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getWallet, getTransactions } from '@/services/wallet.service'
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatRelativeTime } from '@/lib/formatters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { TRANSACTION_TYPES } from '@/lib/constants'
import { supabase } from '@/lib/supabase'

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void }
  }
}
interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayResponse) => void
  prefill?: { email?: string; contact?: string }
  theme?: { color?: string }
  modal?: { ondismiss?: () => void }
}
interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000, 5000]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

async function getAuthToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token || ''
}

async function createRazorpayOrder(amountINR: number) {
  const token = await getAuthToken()
  const res = await fetch('/api/payment/razorpay/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ amountINR }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to create payment order')
  }
  return res.json() as Promise<{ orderId: string; amount: number; currency: string; keyId: string }>
}

async function verifyRazorpayPayment(
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string,
  amountINR: number
) {
  const token = await getAuthToken()
  const res = await fetch('/api/payment/razorpay/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature, amountINR }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Payment verification failed')
  }
  return res.json() as Promise<{ success: boolean; creditedUSD: number; newBalance: number }>
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export default function WalletPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { formatPrice, currency } = useCurrency()
  const [page, setPage] = useState(1)
  const [type, setType] = useState<string>('all')
  const pageSize = 10

  const [addFundsOpen, setAddFundsOpen] = useState(false)
  const [amountINR, setAmountINR] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

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

  useEffect(() => {
    loadRazorpayScript()
  }, [])

  const handleAddFunds = async () => {
    const amount = parseFloat(amountINR)
    if (!amount || amount < 1) {
      toast.error('Enter a valid amount (minimum ₹1)')
      return
    }

    setIsProcessing(true)
    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error('Could not load Razorpay checkout. Check your connection.')

      const order = await createRazorpayOrder(amount)

      const options: RazorpayOptions = {
        key: order.keyId,
        amount: order.amount,
        currency: 'INR',
        name: 'SMMHub',
        description: 'Wallet Top-up',
        order_id: order.orderId,
        handler: async (response: RazorpayResponse) => {
          try {
            const result = await verifyRazorpayPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              amount
            )
            if (result.success) {
              toast.success(`₹${amount} added successfully! Wallet credited.`)
              queryClient.invalidateQueries({ queryKey: ['wallet'] })
              queryClient.invalidateQueries({ queryKey: ['transactions'] })
              setAddFundsOpen(false)
              setAmountINR('')
            }
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Payment verification failed')
          } finally {
            setIsProcessing(false)
          }
        },
        prefill: { email: user?.email },
        theme: { color: '#10b981' },
        modal: {
          ondismiss: () => {
            setIsProcessing(false)
            toast.info('Payment cancelled')
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setIsProcessing(false)
      toast.error(err instanceof Error ? err.message : 'Failed to initiate payment')
    }
  }

  const statCards = [
    {
      title: 'Total Credits',
      value: formatPrice(
        transactions?.data
          .filter((t) => ['credit', 'bonus', 'refund'].includes(t.type))
          .reduce((s, t) => s + t.amount, 0) || 0
      ),
      icon: ArrowDownRight,
      color: 'emerald',
    },
    {
      title: 'Total Debits',
      value: formatPrice(
        transactions?.data
          .filter((t) => ['debit', 'purchase'].includes(t.type))
          .reduce((s, t) => s + t.amount, 0) || 0
      ),
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
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Wallet</h1>
          <p className="text-muted-foreground">Manage your funds and view transaction history</p>
        </div>
        <Button
          className="bg-emerald-500 hover:bg-emerald-600 gap-2"
          onClick={() => setAddFundsOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Funds
        </Button>
      </motion.div>

      {/* Balance card */}
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
                    {formatPrice(wallet?.balance || 0)}
                  </h2>
                )}
                <p className="text-white/70 text-sm mt-2">{currency} Wallet</p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center">
                  <Wallet className="h-10 w-10" />
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-0 gap-1.5"
                  onClick={() => setAddFundsOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Funds
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 text-${stat.color}-500`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Transaction history */}
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
                              {tx.type === 'credit' || tx.type === 'bonus' || tx.type === 'refund' ? '+' : '-'}
                              {formatPrice(tx.amount)}
                            </span>
                          </TableCell>
                          <TableCell>{formatPrice(tx.balance_after)}</TableCell>
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
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
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
                <p className="text-muted-foreground mb-4">
                  Your transaction history will appear here
                </p>
                <Button
                  className="bg-emerald-500 hover:bg-emerald-600 gap-2"
                  onClick={() => setAddFundsOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Funds to Get Started
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Funds Dialog */}
      <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <DialogTitle>Add Funds</DialogTitle>
                <DialogDescription>Top up your wallet using Razorpay</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Preset amounts */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Amount</Label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmountINR(String(preset))}
                    className={`flex items-center justify-center gap-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      amountINR === String(preset)
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                        : 'border-border hover:border-emerald-500/50 text-foreground'
                    }`}
                  >
                    <IndianRupee className="h-3 w-3" />
                    {preset.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div className="space-y-2">
              <Label htmlFor="custom-amount">Or enter custom amount (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="custom-amount"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Enter amount in ₹"
                  value={amountINR}
                  onChange={(e) => setAmountINR(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">Minimum ₹1 · Secure payments via Razorpay</p>
            </div>

            {/* Summary */}
            {amountINR && parseFloat(amountINR) > 0 && (
              <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">You pay</span>
                  <span className="font-medium">₹{parseFloat(amountINR).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Approx. USD credited</span>
                  <span className="font-medium text-emerald-500">
                    ~${(parseFloat(amountINR) / 83.5).toFixed(4)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddFundsOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-500 hover:bg-emerald-600 gap-2"
              onClick={handleAddFunds}
              disabled={isProcessing || !amountINR || parseFloat(amountINR) < 1}
            >
              {isProcessing ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Processing...</>
              ) : (
                <><CreditCard className="h-4 w-4" />Pay with Razorpay</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
