import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getOrderById } from '@/services/orders.service'
import { formatCurrencyByCode, type CurrencyCode } from '@/lib/currency'
import { formatRelativeTime } from '@/lib/formatters'
import { useAuth } from '@/hooks/useAuth'
import type { ReactNode } from 'react'

function Row({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground text-sm">{label}</span>
            <span className={mono ? 'font-mono text-xs' : 'font-medium text-sm text-right'}>{value}</span>
        </div>
    )
}

export default function OrderDetailsDialog({
    orderId, open, onOpenChange, getStatusColor,
}: {
    orderId: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
    getStatusColor: (status: string) => string
}) {
    const { user } = useAuth()
    const { data: order, isLoading } = useQuery({
        queryKey: ['order-details', orderId],
        queryFn: () => getOrderById(orderId!, user!.id),
        enabled: open && !!orderId && !!user,
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Order Details</DialogTitle>
                    <DialogDescription>{order?.service_name ?? '\u00A0'}</DialogDescription>
                </DialogHeader>

                {isLoading || !order ? (
                    <div className="space-y-3">
                        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <Row label="Order ID" value={order.external_order_id || order.id} mono />
                        <Row label="Status" value={<Badge variant="outline" className={getStatusColor(order.status)}>{order.status}</Badge>} />
                        <Row label="Link" value={
                            <a href={order.link} target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline truncate block max-w-[240px]">
                                {order.link}
                            </a>
                        } />
                        <Row label="Quantity" value={order.quantity.toLocaleString()} />
                        {order.start_count != null && <Row label="Start Count" value={order.start_count.toLocaleString()} />}
                        {order.remains != null && <Row label="Remaining" value={order.remains.toLocaleString()} />}
                        <Row label="Charge" value={formatCurrencyByCode(order.price, order.currency as CurrencyCode)} />
                        <Row label="Placed" value={formatRelativeTime(order.created_at)} />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}