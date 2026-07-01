import { forwardRef, useImperativeHandle } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { getWallet } from '@/services/wallet.service'
import { useOrderState } from '@/hooks/useOrderState'
import ServiceSelector from './ServiceSelector'
import OrderDetailsForm from './OrderDetailsForm'
import AuthenticatedSubmitFooter from './footers/AuthenticatedSubmitFooter'
import GuestSubmitFooter from './footers/GuestSubmitFooter'
import { Package } from 'lucide-react'
import type { SMMService } from '@/services/smm-api.service'
import type { CurrencyCode } from '@/lib/currency'

export interface OrderWidgetHandle {
    prefillOrder: (service: SMMService, link?: string, quantity?: string) => void
}

const OrderWidget = forwardRef<OrderWidgetHandle, { compact?: boolean }>(
    function OrderWidget({ compact = false }, ref) {
        const { user } = useAuth()
        const state = useOrderState()

        useImperativeHandle(ref, () => ({
            prefillOrder: (service, link, quantity) => {
                state.selectService(service, link ?? '')
                if (quantity) state.setOrderQuantity(quantity)
            },
        }))

        const { data: wallet } = useQuery({
            queryKey: ['wallet'],
            queryFn: () => getWallet(user!.id),
            enabled: !!user,
        })

        return (
            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
                {/* Left column — service browsing */}
                <div className="min-w-0 w-full">
                    <ServiceSelector
                        {...state}
                        onSelect={(service) => state.selectService(service)}
                        selectedServiceId={state.selectedService?.service}
                        maxHeight={compact ? 'max-h-64' : 'max-h-[420px]'}
                    />
                </div>

                {/* Right column — order form, sticky on scroll so it stays visible while browsing services */}
                <div className="w-full lg:sticky lg:top-4">
                    {state.selectedService ? (
                        <div className="space-y-4 rounded-lg border border-border p-4">
                            <div className="text-sm font-medium line-clamp-2">
                                {state.selectedService.name}
                            </div>

                            <OrderDetailsForm
                                state={state}
                                walletBalance={user && wallet ? Number(wallet.balance) : undefined}
                                walletCurrency={wallet?.currency as CurrencyCode | undefined}
                            />

                            {user ? (
                                <AuthenticatedSubmitFooter
                                    state={state}
                                    userId={user.id}
                                    wallet={wallet || undefined}
                                    platform={state.platform}
                                    onDone={() => { }}
                                />
                            ) : (
                                <GuestSubmitFooter state={state} platform={state.platform} />
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
                            <Package className="h-8 w-8 mb-2 opacity-40" />
                            <p className="text-sm font-medium">Select a service</p>
                            <p className="text-xs mt-1 opacity-60">Choose one from the list to place your order</p>
                        </div>
                    )}
                </div>
            </div>
        )
    }
)

export default OrderWidget