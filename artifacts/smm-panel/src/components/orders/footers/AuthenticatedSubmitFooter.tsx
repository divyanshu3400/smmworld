import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader as Loader2, Wallet, CircleAlert as AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createOrder } from '@/services/orders.service'
import { useCurrency } from '@/contexts/CurrencyContext'
import type { useOrderState } from '@/hooks/useOrderState'

export default function AuthenticatedSubmitFooter({
    state, userId, wallet, platform, onDone,
}: {
    state: ReturnType<typeof useOrderState>
    userId: string
    wallet: { balance: number; currency: string } | undefined
    platform: string
    onDone: () => void
}) {
    const queryClient = useQueryClient()
    const { currency } = useCurrency()
    const { selectedService, orderLink, orderQuantity, calculatePrice, reset } = state

    const price = calculatePrice()
    const insufficientBalance = !!wallet && price > 0 && Number(wallet.balance) < price
    const canSubmit = selectedService && orderLink.length > 3 && orderQuantity

    const createOrderMutation = useMutation({
        mutationFn: async () => {
            if (!selectedService || !orderLink || !orderQuantity) throw new Error('Please fill all fields')
            const quantity = parseInt(orderQuantity)
            const min = parseInt(selectedService.min)
            const max = parseInt(selectedService.max)
            if (isNaN(quantity) || quantity < min || quantity > max) {
                throw new Error(`Quantity must be between ${min.toLocaleString()} and ${max.toLocaleString()}`)
            }
            if (wallet && Number(wallet.balance) < price) {
                throw new Error('Insufficient balance. Please add funds to your wallet.')
            }
            return createOrder(userId, {
                serviceId: selectedService.service,
                serviceName: selectedService.name,
                platform,
                link: orderLink,
                quantity,
            }, currency)
        },
        onSuccess: (result) => {
            if (!result.success) { toast.error(result.error || 'Order failed'); return }
            toast.success('Order placed successfully!')
            reset()
            onDone()
            queryClient.invalidateQueries({ queryKey: ['orders'] })
            queryClient.invalidateQueries({ queryKey: ['wallet'] })
            queryClient.invalidateQueries({ queryKey: ['order-stats'] })
        },
        onError: (error: Error) => toast.error(error.message),
    })

    if (insufficientBalance) {
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-foreground">Insufficient balance</p>
                        <p className="text-xs text-muted-foreground">
                            You need ₹{(price - Number(wallet!.balance)).toFixed(2)} more
                        </p>
                    </div>
                </div>
                <Button
                    className="w-full h-11 text-base font-semibold bg-emerald-500 hover:bg-emerald-600"
                    onClick={() => {
                        const shortfall = Math.ceil(price - Number(wallet!.balance))
                        const returnTo = encodeURIComponent('/dashboard/orders')
                        window.location.href = `/dashboard/wallet?topup=${shortfall}&returnTo=${returnTo}`
                    }}
                >
                    <Wallet className="mr-2 h-4 w-4" />
                    Add Funds to Continue
                </Button>
            </div>
        )
    }

    return (
        <Button
            className="w-full h-12 text-base font-semibold bg-emerald-500 hover:bg-emerald-600"
            onClick={() => createOrderMutation.mutateAsync().catch(() => { })}
            disabled={createOrderMutation.isPending || !canSubmit}
        >
            {createOrderMutation.isPending
                ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing...</>
                : 'Place Order'}
        </Button>
    )
}