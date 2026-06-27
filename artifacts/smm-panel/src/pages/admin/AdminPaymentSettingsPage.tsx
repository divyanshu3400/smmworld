import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CreditCard, Loader as Loader2, Save, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, Circle as XCircle, GripVertical } from 'lucide-react'
import {
  getPaymentSettings,
  updatePaymentSettings,
  type PaymentSettingsResponse,
} from '@/services/admin.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

const PROVIDER_META: Record<
  string,
  { name: string; envVars: string[]; color: string }
> = {
  cashfree: {
    name: 'Cashfree',
    envVars: ['CASHFREE_APP_ID', 'CASHFREE_SECRET_KEY', 'CASHFREE_ENV'],
    color: 'emerald',
  },
  payu: {
    name: 'PayU',
    envVars: ['PAYU_MERCHANT_KEY', 'PAYU_MERCHANT_SALT', 'PAYU_ENV'],
    color: 'blue',
  },
  razorpay: {
    name: 'Razorpay',
    envVars: ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'],
    color: 'amber',
  },
}

export default function AdminPaymentSettingsPage() {
  const queryClient = useQueryClient()
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-payment-settings'],
    queryFn: getPaymentSettings,
  })

  const [priority, setPriority] = useState<string[] | null>(null)
  const [minTopup, setMinTopup] = useState<string>('')

  const effectivePriority = priority ?? settings?.gateway_priority ?? ['cashfree', 'payu', 'razorpay']

  const mutation = useMutation({
    mutationFn: (updates: Parameters<typeof updatePaymentSettings>[0]) =>
      updatePaymentSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-settings'] })
      queryClient.invalidateQueries({ queryKey: ['active-gateways'] })
      toast.success('Payment settings saved')
    },
    onError: () => toast.error('Failed to save settings'),
  })

  const handleToggle = (provider: 'cashfree' | 'payu' | 'razorpay', enabled: boolean) => {
    mutation.mutate({ [`${provider}_enabled`]: enabled })
  }

  const movePriority = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= effectivePriority.length) return
    const next = [...effectivePriority]
    ;[next[index], next[newIndex]] = [next[newIndex], next[index]]
    setPriority(next)
  }

  const handleSavePriority = () => {
    if (priority) {
      mutation.mutate({ gateway_priority: priority })
      setPriority(null)
    }
  }

  const handleSaveMinTopup = () => {
    const val = parseFloat(minTopup)
    if (!val || val <= 0) {
      toast.error('Enter a valid minimum amount')
      return
    }
    mutation.mutate({ min_topup_inr: val })
    setMinTopup('')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Failed to load payment settings.
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold text-foreground">Payment Gateways</h1>
        <p className="text-muted-foreground">
          Enable gateways, set fallback priority, and configure minimum top-up
        </p>
      </motion.div>

      {/* Gateway toggles */}
      <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
        {(['cashfree', 'payu', 'razorpay'] as const).map((provider) => {
          const meta = PROVIDER_META[provider]
          const enabled = settings[`${provider}_enabled` as keyof PaymentSettingsResponse] as boolean
          const configured = settings.configured[provider]
          return (
            <Card key={provider}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-9 w-9 rounded-lg bg-${meta.color}-500/10 flex items-center justify-center`}>
                      <CreditCard className={`h-4 w-4 text-${meta.color}-500`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{meta.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {enabled ? 'Active' : 'Disabled'}
                      </CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => handleToggle(provider, checked)}
                    disabled={mutation.isPending}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    {configured ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-muted-foreground">API keys configured</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-muted-foreground">Keys missing</span>
                      </>
                    )}
                  </div>
                  {!configured && enabled && (
                    <div className="flex items-start gap-2 rounded-md bg-amber-500/10 p-2 text-xs text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <span>
                        Enabled but server env vars are not set. Add{' '}
                        {meta.envVars.join(', ')} to the API server.
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground pt-1">
                    Required env vars: {meta.envVars.join(', ')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>

      {/* Fallback priority */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle>Fallback Priority</CardTitle>
            <CardDescription>
              When a user tops up, the primary gateway is tried first. If it
              fails (downtime, misconfiguration), the next enabled gateway is
              used automatically. Drag with the arrows to reorder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {effectivePriority.map((provider, index) => {
                const meta = PROVIDER_META[provider]
                const enabled =
                  settings[`${provider}_enabled` as keyof PaymentSettingsResponse] as boolean
                return (
                  <div
                    key={provider}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="flex flex-col">
                      <button
                        onClick={() => movePriority(index, -1)}
                        disabled={index === 0}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        aria-label="Move up"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6" /></svg>
                      </button>
                      <button
                        onClick={() => movePriority(index, 1)}
                        disabled={index === effectivePriority.length - 1}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        aria-label="Move down"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                      </button>
                    </div>
                    <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                    <span className="font-medium">{meta.name}</span>
                    {index === 0 && <Badge className="bg-emerald-500/10 text-emerald-500">Primary</Badge>}
                    {index > 0 && enabled && <Badge variant="secondary">Fallback {index}</Badge>}
                    {!enabled && <Badge variant="outline" className="text-muted-foreground">Disabled</Badge>}
                  </div>
                )
              })}
            </div>
            {priority && (
              <div className="mt-4 flex gap-2">
                <Button onClick={handleSavePriority} disabled={mutation.isPending} className="bg-emerald-500 hover:bg-emerald-600">
                  {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save priority
                </Button>
                <Button variant="outline" onClick={() => setPriority(null)}>Cancel</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Minimum top-up */}
      <motion.div variants={item}>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Minimum Top-up</CardTitle>
            <CardDescription>Lowest amount a user can add to their wallet (in ₹)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min="1"
                step="1"
                placeholder={String(settings.min_topup_inr)}
                value={minTopup}
                onChange={(e) => setMinTopup(e.target.value)}
                className="max-w-[120px]"
              />
              <Button onClick={handleSaveMinTopup} disabled={mutation.isPending || !minTopup}>
                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Separator />

      <motion.div variants={item} className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">How fallback works</p>
        <p>
          When a user clicks "Add Funds", the server creates an order with the
          primary gateway. If that gateway's API call fails, the server
          automatically retries with the next enabled gateway in this list.
          The user only sees the working payment method — no manual switching.
          API keys are stored in server environment variables, never in the
          database.
        </p>
      </motion.div>
    </motion.div>
  )
}
