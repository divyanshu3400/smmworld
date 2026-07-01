// src/components/orders/footers/GuestSubmitFooter.tsx
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader as Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { useOrderState } from '@/hooks/useOrderState'
import { startGuestCheckout } from '@/services'
import { launchPaymentGateway } from '@/lib/launchPaymentGateway'

const MIN_ORDER_AMOUNT_INR = 1

type PaymentState = 'idle' | 'creating' | 'waiting' | 'failed'

export default function GuestSubmitFooter({
    state, platform,
}: {
    state: ReturnType<typeof useOrderState>
    platform: string
}) {
    const { selectedService, orderLink, orderQuantity, calculatePrice } = state
    const [email, setEmail] = useState('')
    const [paymentState, setPaymentState] = useState<PaymentState>('idle')
    const [statusMessage, setStatusMessage] = useState('')
    const [activeOrderId, setActiveOrderId] = useState<string | null>(null)

    const price = calculatePrice()
    const isAmountTooLow = !price || price < MIN_ORDER_AMOUNT_INR

    const checkoutMutation = useMutation({
        mutationFn: () => {
            if (!selectedService || !orderLink || !orderQuantity) throw new Error('Please fill all fields')
            if (!email) throw new Error('Email is required to track your order')
            if (isAmountTooLow) throw new Error(`Order amount must be at least ₹${MIN_ORDER_AMOUNT_INR}. Please increase the quantity.`)
            setPaymentState('creating')
            setStatusMessage('')
            return startGuestCheckout({
                serviceId: `${selectedService.service}`,
                serviceName: selectedService.name,
                platform,
                link: orderLink,
                quantity: parseInt(orderQuantity),
                email,
            })
        },
        onSuccess: async (order) => {
            try {
                await launchPaymentGateway(order, {
                    onOrderCreated: (orderId) => setActiveOrderId(orderId),
                    onWaiting: (message) => {
                        setPaymentState('waiting')
                        setStatusMessage(message)
                    },
                })
            } catch (err) {
                setPaymentState('failed')
                const msg = err instanceof Error ? err.message : 'Failed to launch payment'
                setStatusMessage(msg)
                toast.error(msg)
            }
        },
        onError: (error: Error) => {
            setPaymentState('failed')
            toast.error(error.message)
        },
    })

    const isBusy = checkoutMutation.isPending || paymentState === 'creating' || paymentState === 'waiting'

    return (
        <div className="space-y-3">
            <div className="space-y-1">
                <label className="text-sm font-medium">Email (to track your order)</label>
                <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <Button
                className="w-full bg-emerald-500 hover:bg-emerald-600"
                onClick={() => checkoutMutation.mutateAsync().catch(() => { })}
                disabled={isBusy || !selectedService || isAmountTooLow}
            >
                {isBusy
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {paymentState === 'waiting' ? 'Waiting for payment...' : 'Redirecting to payment...'}
                    </>
                    : isAmountTooLow
                        ? 'Increase quantity to meet minimum order amount'
                        : `Pay ₹${price} & Place Order`}
            </Button>
            {isAmountTooLow && selectedService && (
                <p className="text-xs text-destructive text-center">
                    Minimum order amount is ₹{MIN_ORDER_AMOUNT_INR}. Current amount: ₹{price ?? 0}.
                </p>
            )}
            {statusMessage && (
                <p className={`text-xs text-center ${paymentState === 'failed' ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {statusMessage}
                </p>
            )}
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                    ⚠️ Guest orders may occasionally face tracking or refund issues.{' '}
                    <a href="/login" className="font-medium underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-300">
                        Log in
                    </a>{' '}
                    or{' '}
                    <a href="/signup" className="font-medium underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-300">
                        create an account
                    </a>{' '}
                    to avoid problems and track all your orders in one place.
                </p>
            </div>
        </div>
    )
}