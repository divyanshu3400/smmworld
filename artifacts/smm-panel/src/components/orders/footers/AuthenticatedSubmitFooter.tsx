import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader as Loader2 } from 'lucide-react'
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
            <div className="space-y-2">
                <p className="text-sm text-red-500">
                    You need ₹{(price - Number(wallet!.balance)).toFixed(2)} more to place this order.
                </p>
                <Button
                    className="w-full bg-emerald-500 hover:bg-emerald-600"

                    onClick={() => {
                        const shortfall = Math.ceil(price - Number(wallet!.balance))
                        const returnTo = encodeURIComponent('/dashboard/orders')
                        window.location.href = `/dashboard/wallet?topup=${shortfall}&returnTo=${returnTo}`
                    }}
                >
                    Add Funds to Continue
                </Button>
            </div>
        )
    }

    return (
        <Button
            className="w-full bg-emerald-500 hover:bg-emerald-600"
            onClick={() => createOrderMutation.mutateAsync().catch(() => { })}
            disabled={createOrderMutation.isPending || !selectedService}
        >
            {createOrderMutation.isPending
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                : 'Place Order'}
        </Button>
    )
}