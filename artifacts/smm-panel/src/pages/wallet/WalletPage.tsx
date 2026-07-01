import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Wallet, ArrowDownRight, ArrowUpRight, ListFilter as Filter, Download, ChevronLeft, ChevronRight, Plus, Loader as Loader2, CreditCard, IndianRupee, Smartphone, ExternalLink, CircleCheck as CheckCircle2, Clock, Circle as XCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { apiUrl } from '@/lib/api'
import { getWallet, getTransactions } from '@/services/wallet.service'
import { getActiveGateways, type GatewayListResponse } from '@/services/admin.service'
import { useCurrency } from '@/contexts/CurrencyContext'
import { getCurrencySymbol, type CurrencyCode } from '@/lib/currency'
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
import { CreateOrderResponse, launchPaymentGateway, type PaymentFlow } from '@/lib/launchPaymentGateway'
import { usePaymentVerification, verifyGatewayPayment, pollOrderStatus } from '@/hooks/usePaymentVerification'

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void }
    Cashfree?: (config: { mode: 'production' | 'sandbox' }) => {
      checkout: (params: {
        paymentSessionId: string;
        redirectTarget?: '_self' | '_blank' | '_modal';
      }) => Promise<void>
    }
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


async function createGatewayOrder(amountINR: number, flow: PaymentFlow = 'wallet_topup', returnTo?: string): Promise<CreateOrderResponse> {
  const token = await getAuthToken()
  const res = await fetch(apiUrl('/api/payment/create-order'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ amountINR, flow, returnTo }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to create payment order')
  }
  return res.json()
}

type PaymentState = 'idle' | 'creating' | 'waiting' | 'verifying' | 'done' | 'failed'

export default function WalletPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { formatWalletAmount, currency } = useCurrency()
  const currencySymbol = getCurrencySymbol(currency as CurrencyCode)
  const [page, setPage] = useState(1)
  const [type, setType] = useState<string>('all')
  const pageSize = 10
  const [pendingReturnTo, setPendingReturnTo] = useState<string | null>(null)

  const [addFundsOpen, setAddFundsOpen] = useState(false)
  const [amountINR, setAmountINR] = useState('')
  const [paymentState, setPaymentState] = useState<PaymentState>('idle')
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('')

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

  const { data: gateways } = useQuery<GatewayListResponse>({
    queryKey: ['active-gateways'],
    queryFn: getActiveGateways,
    enabled: !!user?.id,
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const orderId = params.get('order_id')
    const topup = params.get('topup')
    const returnTo = params.get('returnTo')

    // Case 1: returning from a gateway redirect (existing behavior, unchanged)
    if (orderId) {
      window.history.replaceState({}, '', '/wallet')

      setAddFundsOpen(true)
      setActiveOrderId(orderId)
      setPaymentState('verifying')

      verifyGatewayPayment(orderId).then((result) => {
        if (result.success) {
          setPaymentState('done')
          toast.success(`${currencySymbol}${result.amountINR} added successfully! Wallet credited.`)
          queryClient.invalidateQueries({ queryKey: ['wallet'] })
          queryClient.invalidateQueries({ queryKey: ['transactions'] })
        } else {
          setPaymentState('waiting')
          setActiveOrderId(orderId)
          setStatusMessage(result.message || 'Payment not confirmed yet. Click verify if you have paid.')
        }
      }).catch(() => {
        setPaymentState('waiting')
        setActiveOrderId(orderId)
        setStatusMessage('Could not verify automatically. Click verify if you have paid.')
      })
      return
    }

    // Case 2: arrived here to top up before continuing an order elsewhere
    if (topup) {
      window.history.replaceState({}, '', '/wallet')

      const amount = Math.max(1, Math.ceil(Number(topup)))
      if (!isNaN(amount)) {
        setAmountINR(String(amount))
      }
      if (returnTo) {
        setPendingReturnTo(decodeURIComponent(returnTo))
      }
      setAddFundsOpen(true)
      setPaymentState('idle')
    }
  }, [])

  useEffect(() => {
    if (paymentState !== 'waiting' || !activeOrderId) return
    let cancelled = false
    const interval = setInterval(async () => {
      try {
        const status = await pollOrderStatus(activeOrderId)
        if (cancelled) return
        if (status === 'paid') {
          clearInterval(interval)
          setPaymentState('verifying')
          const result = await verifyGatewayPayment(activeOrderId)
          if (result.success) {
            setPaymentState('done')
            toast.success(`${currencySymbol}${result.amountINR} added successfully! Wallet credited.`)
            queryClient.invalidateQueries({ queryKey: ['wallet'] })
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
          } else {
            setPaymentState('failed')
            setStatusMessage(result.message || 'Payment verification failed')
          }
        } else if (status === 'failed') {
          clearInterval(interval)
          setPaymentState('failed')
          setStatusMessage('Payment failed. Please try again.')
        }
      } catch {
        // keep polling
      }
    }, 4000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [paymentState, activeOrderId, queryClient])

  const resetDialog = (opts?: { skipReturn?: boolean }) => {
    setAddFundsOpen(false)
    setAmountINR('')
    setPaymentState('idle')
    setActiveOrderId(null)
    setStatusMessage('')

    if (pendingReturnTo && !opts?.skipReturn) {
      const dest = pendingReturnTo
      setPendingReturnTo(null)
      window.location.href = dest
    } else {
      setPendingReturnTo(null)
    }
  }
  const handleAddFunds = async () => {
    const amount = parseFloat(amountINR)
    if (!amount || amount < 1) {
      toast.error(`Enter a valid amount (minimum ${currencySymbol}1)`)
      return
    }

    const minTopup = gateways?.minTopupINR || 1
    if (amount < minTopup) {
      toast.error(`Minimum top-up is ${currencySymbol}${minTopup}`)
      return
    }

    if (!gateways?.gateways?.length) {
      toast.error('No payment gateway is active. Please contact support.')
      return
    }

    setPaymentState('creating')
    setStatusMessage('')

    try {
      // Build returnTo URL if we have a pending redirect after topup
      const returnTo = pendingReturnTo ? `/wallet?returnTo=${encodeURIComponent(pendingReturnTo)}` : undefined
      const order = await createGatewayOrder(amount, 'wallet_topup', returnTo)
      await launchPaymentGateway(order, {
        onOrderCreated: (orderId) => setActiveOrderId(orderId),
        onWaiting: (message) => {
          setPaymentState('waiting')
          setStatusMessage(message)
        },
      })
    } catch (err) {
      setPaymentState('failed')
      setStatusMessage(err instanceof Error ? err.message : 'Failed to initiate payment')
      toast.error(err instanceof Error ? err.message : 'Failed to initiate payment')
    }
  }
  // Manual verify button (user clicks "I have paid" after returning from gateway).
  const handleVerify = async () => {
    if (!activeOrderId) return
    setPaymentState('verifying')
    try {
      const result = await verifyGatewayPayment(activeOrderId)
      if (result.success) {
        setPaymentState('done')
        toast.success(`${currencySymbol}${result.amountINR} added successfully! Wallet credited.`)
        queryClient.invalidateQueries({ queryKey: ['wallet'] })
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
      } else {
        setPaymentState('waiting')
        setStatusMessage(result.message || 'Payment not confirmed yet. If you have paid, please wait a moment and try again.')
        toast.info(result.message || 'Payment not confirmed yet')
      }
    } catch (err) {
      setPaymentState('waiting')
      setStatusMessage(err instanceof Error ? err.message : 'Verification failed')
      toast.error(err instanceof Error ? err.message : 'Verification failed')
    }
  }

  const statCards = [
    {
      title: 'Total Credits',
      value: formatWalletAmount(
        transactions?.data
          .filter((t) => ['credit', 'bonus', 'refund'].includes(t.type))
          .reduce((s, t) => s + t.amount, 0) || 0
      ),
      icon: ArrowDownRight,
      color: 'emerald',
    },
    {
      title: 'Total Debits',
      value: formatWalletAmount(
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

  const providerLabel: Record<string, string> = {
    cashfree: 'Cashfree',
    payu: 'PayU',
    razorpay: 'Razorpay',
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Wallet</h1>
          <p className="text-muted-foreground">Manage your funds and view transaction history</p>
        </div>
        <Button
          className="bg-emerald-500 hover:bg-emerald-600 gap-2"
          onClick={() => { setAddFundsOpen(true); setPaymentState('idle') }}
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
                    {formatWalletAmount(wallet?.balance || 0)}
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
                  onClick={() => { setAddFundsOpen(true); setPaymentState('idle') }}
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
                              className={`${tx.type === 'credit' || tx.type === 'bonus' || tx.type === 'refund'
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
                              className={`font-medium ${tx.type === 'credit' || tx.type === 'bonus' || tx.type === 'refund'
                                ? 'text-emerald-500'
                                : 'text-red-500'
                                }`}
                            >
                              {tx.type === 'credit' || tx.type === 'bonus' || tx.type === 'refund' ? '+' : '-'}
                              {formatWalletAmount(tx.amount)}
                            </span>
                          </TableCell>
                          <TableCell>{formatWalletAmount(tx.balance_after)}</TableCell>
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
                  onClick={() => { setAddFundsOpen(true); setPaymentState('idle') }}
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
      <Dialog open={addFundsOpen} onOpenChange={(open) => { if (!open) resetDialog(); else setAddFundsOpen(true) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <DialogTitle>Add Funds</DialogTitle>
                <DialogDescription>
                  {gateways?.gateways?.length
                    ? `Top up via ${gateways.gateways.map((g) => providerLabel[g] || g).join(' · ')}`
                    : 'No payment gateway active'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {paymentState === 'idle' && (
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
                      className={`flex items-center justify-center gap-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${amountINR === String(preset)
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
                <Label htmlFor="custom-amount">Or enter custom amount ({currencySymbol})</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="custom-amount"
                    type="number"
                    min={gateways?.minTopupINR || 1}
                    step="1"
                    placeholder={`Enter amount in ${currencySymbol}`}
                    value={amountINR}
                    onChange={(e) => setAmountINR(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum {currencySymbol}{gateways?.minTopupINR || 1} · UPI, cards & netbanking supported
                </p>
              </div>

              {/* Summary */}
              {amountINR && parseFloat(amountINR) > 0 && (
                <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">You pay</span>
                    <span className="font-medium">{currencySymbol}{parseFloat(amountINR).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credited to wallet</span>
                    <span className="font-medium text-emerald-500">
                      {currencySymbol}{parseFloat(amountINR).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              {/* Active gateways info */}
              {gateways?.gateways?.length ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>
                    Works on desktop & mobile. UPI Collect sends a request to your UPI app — approve it there.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <XCircle className="h-3.5 w-3.5" />
                  <span>No payment gateway is active. Ask an admin to enable one.</span>
                </div>
              )}
            </div>
          )}

          {paymentState === 'creating' && (
            <div className="py-8 flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <p className="text-sm text-muted-foreground">Creating your payment order…</p>
            </div>
          )}

          {paymentState === 'waiting' && (
            <div className="py-6 space-y-4">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Clock className="h-7 w-7 text-emerald-500" />
                </div>
                <div>
                  <p className="font-medium">Waiting for payment confirmation</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">{statusMessage}</p>
                </div>
              </div>
              <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                <p>
                  If you have completed the payment, click below to verify. We
                  check the gateway directly — your wallet is only credited
                  after the payment is confirmed, so false claims cannot credit
                  your account.
                </p>
              </div>
              <Button onClick={handleVerify} className="w-full bg-emerald-500 hover:bg-emerald-600 gap-2">
                <CheckCircle2 className="h-4 w-4" />
                I have paid — verify now
              </Button>
            </div>
          )}

          {paymentState === 'verifying' && (
            <div className="py-8 flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <p className="text-sm text-muted-foreground">Verifying your payment…</p>
            </div>
          )}

          {paymentState === 'done' && (
            <div className="py-8 flex flex-col items-center gap-3 text-center">
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <div>
                <p className="font-medium">Payment successful!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {pendingReturnTo
                    ? 'Your wallet has been credited. Taking you back to finish your order…'
                    : 'Your wallet has been credited.'}
                </p>
              </div>
              <Button onClick={() => resetDialog()} className="bg-emerald-500 hover:bg-emerald-600">
                {pendingReturnTo ? 'Continue Order' : 'Done'}
              </Button>
            </div>
          )}

          {paymentState === 'failed' && (
            <div className="py-6 space-y-4">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center">
                  <XCircle className="h-7 w-7 text-red-500" />
                </div>
                <div>
                  <p className="font-medium">Payment failed</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">{statusMessage}</p>
                </div>
              </div>
              <Button onClick={() => setPaymentState('idle')} variant="outline" className="w-full">
                Try again
              </Button>
            </div>
          )}

          {paymentState === 'idle' && (
            <DialogFooter>
              <Button variant="outline" onClick={() => resetDialog({ skipReturn: true })} disabled={paymentState !== 'idle'}>
                Cancel
              </Button>
              <Button
                className="bg-emerald-500 hover:bg-emerald-600 gap-2"
                onClick={handleAddFunds}
                disabled={
                  paymentState !== 'idle' ||
                  !amountINR ||
                  parseFloat(amountINR) < (gateways?.minTopupINR || 1) ||
                  !gateways?.gateways?.length
                }
              >
                <CreditCard className="h-4 w-4" />
                Pay {currencySymbol}{amountINR && parseFloat(amountINR) > 0 ? parseFloat(amountINR).toLocaleString('en-IN') : ''}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
