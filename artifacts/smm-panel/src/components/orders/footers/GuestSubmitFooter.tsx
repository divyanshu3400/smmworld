// src/components/orders/footers/GuestSubmitFooter.tsx
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader as Loader2, Mail, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, ShieldCheck } from 'lucide-react'
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
    const [emailTouched, setEmailTouched] = useState(false)
    const [paymentState, setPaymentState] = useState<PaymentState>('idle')
    const [statusMessage, setStatusMessage] = useState('')
    const [activeOrderId, setActiveOrderId] = useState<string | null>(null)

    const price = calculatePrice()
    const isAmountTooLow = !price || price < MIN_ORDER_AMOUNT_INR

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    const showEmailError = emailTouched && !emailValid && email.length > 0

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
    const canSubmit = selectedService && emailValid && !isAmountTooLow && orderLink.length > 3

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    Your email
                    {emailValid && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                </label>
                <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    className={`h-11 text-base ${showEmailError ? 'border-destructive' : emailValid ? 'border-emerald-500/50' : ''}`}
                />
                {showEmailError ? (
                    <p className="text-xs text-destructive flex items-center gap-1.5">
                        <AlertCircle className="h-3 w-3" />
                        Please enter a valid email address
                    </p>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        We'll send order tracking link to this email
                    </p>
                )}
            </div>

            <Button
                className="w-full h-12 text-base font-semibold bg-emerald-500 hover:bg-emerald-600"
                onClick={() => checkoutMutation.mutateAsync().catch(() => { })}
                disabled={isBusy || !canSubmit}
            >
                {isBusy
                    ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {paymentState === 'waiting' ? 'Waiting for payment...' : 'Redirecting to payment...'}
                    </>
                    : isAmountTooLow
                        ? 'Increase quantity to continue'
                        : `Pay ₹${price} Securely`}
            </Button>

            {isAmountTooLow && selectedService && (
                <p className="text-sm text-destructive text-center flex items-center justify-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    Minimum order: ₹{MIN_ORDER_AMOUNT_INR}. Current: ₹{price ?? 0}
                </p>
            )}
            {statusMessage && (
                <p className={`text-sm text-center ${paymentState === 'failed' ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {statusMessage}
                </p>
            )}

            <div className="rounded-lg border border-border bg-muted/50 p-3">
                <div className="flex items-start gap-2.5">
                    <ShieldCheck className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground">
                            <strong className="text-foreground">Consider creating an account</strong> to:
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                            <li>Track all orders in one place</li>
                            <li>Get faster support</li>
                            <li>Access exclusive discounts</li>
                        </ul>
                        <div className="flex gap-2 pt-1.5">
                            <a href="/login" className="text-xs font-medium text-emerald-500 hover:text-emerald-400">
                                Log in →
                            </a>
                            <span className="text-muted-foreground">|</span>
                            <a href="/signup" className="text-xs font-medium text-emerald-500 hover:text-emerald-400">
                                Create account →
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}