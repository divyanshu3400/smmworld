import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getFrequentServices, type FrequentService, type SMMService } from '@/services/smm-api.service'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Instagram, Youtube, Facebook, Music2, Twitter, Send,
    Music, Linkedin, MessageCircle, Pin, Camera, Video, Zap, RotateCcw,
} from 'lucide-react'

interface FrequentServicesProps {
    totalOrders: number
    onQuickOrder: (service: SMMService, prefillLink: string) => void
}

function getPlatformIcon(platform: string, name: string) {
    const p = (platform || name || '').toLowerCase()
    if (p.includes('instagram') || p.includes('ig')) return <Instagram className="h-4 w-4" />
    if (p.includes('youtube') || p.includes('yt')) return <Youtube className="h-4 w-4" />
    if (p.includes('facebook') || p.includes('fb')) return <Facebook className="h-4 w-4" />
    if (p.includes('tiktok') || p.includes('tt')) return <Music2 className="h-4 w-4" />
    if (p.includes('twitter') || p.includes('tweet') || p.includes(' x ')) return <Twitter className="h-4 w-4" />
    if (p.includes('telegram') || p.includes('tg')) return <Send className="h-4 w-4" />
    if (p.includes('spotify')) return <Music className="h-4 w-4" />
    if (p.includes('linkedin')) return <Linkedin className="h-4 w-4" />
    if (p.includes('threads')) return <MessageCircle className="h-4 w-4" />
    if (p.includes('pinterest') || p.includes('pin')) return <Pin className="h-4 w-4" />
    if (p.includes('snapchat')) return <Camera className="h-4 w-4" />
    if (p.includes('twitch')) return <Video className="h-4 w-4" />
    return <Zap className="h-4 w-4" />
}

async function fetchFrequent(): Promise<FrequentService[]> {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return []
    return getFrequentServices(token)
}

export default function FrequentServices({ totalOrders, onQuickOrder }: FrequentServicesProps) {
    const { data: services = [], isLoading } = useQuery({
        queryKey: ['frequent-services'],
        queryFn: fetchFrequent,
        staleTime: 2 * 60 * 1000,
        enabled: totalOrders >= 2,
    })

    if (totalOrders < 2) return null

    if (isLoading) {
        return (
            <div className="mb-4">
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-44 shrink-0 rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    if (!services.length) return null

    return (
        <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
                <RotateCcw className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-semibold text-foreground">Order Again</span>
                <span className="text-xs text-muted-foreground">— your most-used services</span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border">
                {services.map((svc) => {
                    const smmService: SMMService = {
                        service: Number(svc.service_id),
                        name: svc.service_name,
                        type: '',
                        rate: '0',
                        min: '100',
                        max: '100000',
                        category: svc.platform,
                    }

                    return (
                        <div
                            key={svc.service_id}
                            className="shrink-0 w-44 rounded-xl border border-border bg-card p-3 flex flex-col gap-2 hover:border-emerald-500/50 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-1">
                                <div className="text-emerald-500 mt-0.5">
                                    {getPlatformIcon(svc.platform, svc.service_name)}
                                </div>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                    ×{svc.order_count}
                                </Badge>
                            </div>

                            <p className="text-xs font-medium leading-snug line-clamp-2 text-foreground">
                                {svc.service_name}
                            </p>

                            <p className="text-[10px] text-muted-foreground">
                                Ordered {svc.order_count} {svc.order_count === 1 ? 'time' : 'times'}
                            </p>

                            <Button
                                size="sm"
                                className="h-7 text-xs w-full bg-emerald-500 hover:bg-emerald-600 text-white mt-auto"
                                onClick={() => onQuickOrder(smmService, svc.last_link)}
                            >
                                Quick Order
                            </Button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
