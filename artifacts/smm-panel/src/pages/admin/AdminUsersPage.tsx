import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Users,
  PlusCircle,
  MinusCircle,
  CheckCircle,
  XCircle,
  Calendar,
  ShoppingCart,
} from 'lucide-react'
import { getAdminUsers, adjustUserWallet, type AdminUser } from '@/services/admin.service'
import { formatCurrency, formatRelativeTime, formatDate } from '@/lib/formatters'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [walletAmount, setWalletAmount] = useState('')
  const [walletType, setWalletType] = useState<'credit' | 'debit'>('credit')
  const [walletReason, setWalletReason] = useState('')

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => getAdminUsers(page, 20, search),
    placeholderData: (prev) => prev,
  })

  const adjustMutation = useMutation({
    mutationFn: () =>
      adjustUserWallet(
        selectedUser!.id,
        parseFloat(walletAmount),
        walletType,
        walletReason
      ),
    onSuccess: (res) => {
      toast.success(`Wallet ${walletType === 'credit' ? 'credited' : 'debited'} — new balance: $${res.newBalance.toFixed(2)}`)
      setSelectedUser(null)
      setWalletAmount('')
      setWalletReason('')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const totalPages = data ? Math.ceil(data.total / 20) : 1

  const getInitials = (user: AdminUser) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    }
    return user.email[0].toUpperCase()
  }

  const getDisplayName = (user: AdminUser) => {
    if (user.first_name || user.last_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(' ')
    }
    return user.email.split('@')[0]
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {data?.total ? `${data.total.toLocaleString()} registered users` : 'Manage users & wallets'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-users'] })}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by email or name…"
                className="pl-9 h-9 max-w-sm"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : data?.users && data.users.length > 0 ? (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b border-border">
                      <tr>
                        {['User', 'Email', 'Balance', 'Orders', 'Joined', 'Status', 'Actions'].map((h) => (
                          <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3 first:pl-6 last:pr-6">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.users.map((user) => (
                        <tr key={user.id} className="hover:bg-accent/20 transition-colors">
                          <td className="px-4 py-3 pl-6">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center text-xs font-semibold text-emerald-500 flex-shrink-0">
                                {getInitials(user)}
                              </div>
                              <span className="font-medium max-w-[120px] truncate">{getDisplayName(user)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {user.email}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-semibold tabular-nums ${user.balance > 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                              ${user.balance.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3 tabular-nums">{user.total_orders}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(user.created_at, 'MMM d, yyyy')}
                          </td>
                          <td className="px-4 py-3">
                            {user.is_confirmed ? (
                              <Badge variant="outline" className="text-xs gap-1 text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
                                <CheckCircle className="h-3 w-3" /> Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs gap-1 text-amber-500 border-amber-500/30 bg-amber-500/10">
                                <XCircle className="h-3 w-3" /> Unverified
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 pr-6">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1.5 hover:border-emerald-500/50 hover:text-emerald-500"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Wallet className="h-3.5 w-3.5" />
                              Wallet
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-border">
                  {data.users.map((user) => (
                    <div key={user.id} className="p-4 hover:bg-accent/20 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center text-sm font-semibold text-emerald-500">
                            {getInitials(user)}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{getDisplayName(user)}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Wallet className="h-3.5 w-3.5" />
                          Adjust
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Wallet className="h-3 w-3" />
                          <span className={`font-semibold ${user.balance > 0 ? 'text-emerald-500' : ''}`}>
                            ${user.balance.toFixed(2)}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <ShoppingCart className="h-3 w-3" />
                          {user.total_orders} orders
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(user.created_at, 'MMM d')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of {data.total.toLocaleString()} users
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
                <Users className="mx-auto h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">No users found</p>
                <p className="text-sm mt-1">Try a different search</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Wallet Adjustment Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(o) => !o && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Wallet</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <span>
                  User: <strong>{selectedUser.email}</strong>
                  <br />
                  Current balance:{' '}
                  <strong className="text-emerald-500">${selectedUser.balance.toFixed(2)}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setWalletType('credit')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  walletType === 'credit'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-border hover:border-emerald-500/40'
                }`}
              >
                <PlusCircle className={`h-6 w-6 ${walletType === 'credit' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${walletType === 'credit' ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                  Credit
                </span>
              </button>
              <button
                onClick={() => setWalletType('debit')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  walletType === 'debit'
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-border hover:border-red-500/40'
                }`}
              >
                <MinusCircle className={`h-6 w-6 ${walletType === 'debit' ? 'text-red-500' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${walletType === 'debit' ? 'text-red-500' : 'text-muted-foreground'}`}>
                  Debit
                </span>
              </button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="pl-7"
                  placeholder="0.00"
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reason">Reason / Description</Label>
              <Textarea
                id="reason"
                placeholder="e.g. Manual top-up, promotional credit, dispute resolution…"
                className="resize-none h-20"
                value={walletReason}
                onChange={(e) => setWalletReason(e.target.value)}
              />
            </div>

            {walletAmount && selectedUser && (
              <div className="p-3 rounded-lg bg-muted text-sm flex items-center justify-between">
                <span className="text-muted-foreground">New balance will be:</span>
                <span className={`font-bold ${walletType === 'credit' ? 'text-emerald-500' : 'text-red-500'}`}>
                  ${(
                    walletType === 'credit'
                      ? selectedUser.balance + parseFloat(walletAmount || '0')
                      : selectedUser.balance - parseFloat(walletAmount || '0')
                  ).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancel</Button>
            <Button
              onClick={() => adjustMutation.mutate()}
              disabled={!walletAmount || !walletReason || adjustMutation.isPending}
              className={walletType === 'credit' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}
            >
              {adjustMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : walletType === 'credit' ? (
                <PlusCircle className="h-4 w-4 mr-2" />
              ) : (
                <MinusCircle className="h-4 w-4 mr-2" />
              )}
              {walletType === 'credit' ? 'Add Funds' : 'Deduct Funds'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
