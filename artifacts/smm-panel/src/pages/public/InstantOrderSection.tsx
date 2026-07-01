import { Zap, ShieldCheck, Clock, CreditCard } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import OrderWidget from '@/components/orders/OrderWidget'

const trustPoints = [
    { icon: Zap, label: 'Starts in minutes', description: 'No approval wait — orders begin processing right after payment' },
    { icon: ShieldCheck, label: 'No account required', description: 'Pay, place your order, and we\'ll email you a tracking link' },
    { icon: CreditCard, label: 'Secure checkout', description: 'UPI, cards & netbanking via Cashfree — we never store your card' },
]

export default function InstantOrderSection() {
    return (
        <section className="container mx-auto py-12 md:py-16">
            <div className="text-center max-w-2xl mx-auto mb-8">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500 mb-4">
                    <Clock className="h-3 w-3" />
                    Most orders start within 5 minutes
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                    Buy Instagram, YouTube & TikTok Growth — Right Here
                </h2>
                <p className="text-muted-foreground mt-3 text-base md:text-lg">
                    Pick a service below, drop in your profile or post link, and check out.
                    No sign-up needed — we'll email you a link to track your order.
                </p>
            </div>

            <Card className="overflow-hidden">
                <CardContent className="p-4 md:p-6">
                    <OrderWidget compact />
                </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-3 mt-6">
                {trustPoints.map(({ icon: Icon, label, description }) => (
                    <div key={label} className="flex items-start gap-3 rounded-lg border border-border p-4">
                        <div className="h-9 w-9 shrink-0 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Icon className="h-4.5 w-4.5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">{label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}