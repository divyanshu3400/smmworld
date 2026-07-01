// src/components/orders/OrderDetailsForm.tsx
import { useState, useMemo } from 'react'
import { CheckCircle2, AlertCircle, ExternalLink, Zap } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatCurrencyByCode, type CurrencyCode } from '@/lib/currency'
import { detectPlatformFromUrl } from '@/lib/platformDetector'
import type { useOrderState } from '@/hooks/useOrderState'

type OrderState = ReturnType<typeof useOrderState>

function Separator() {
  return <div className="h-px bg-border my-2" />
}

const PLATFORM_LABELS: Record<string, string> = {
    instagram: 'Instagram',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    facebook: 'Facebook',
    twitter: 'X (Twitter)',
    telegram: 'Telegram',
    spotify: 'Spotify',
    linkedin: 'LinkedIn',
    snapchat: 'Snapchat',
    threads: 'Threads',
}

export default function OrderDetailsForm({
  state, walletBalance, walletCurrency,
}: {
  state: OrderState
  walletBalance?: number
  walletCurrency?: CurrencyCode
}) {
  const { selectedService, orderLink, setOrderLink, orderQuantity, setOrderQuantity, calculatePrice, selectedCategory } = state
  const [linkTouched, setLinkTouched] = useState(false)
  const [quantityTouched, setQuantityTouched] = useState(false)

  if (!selectedService) return null

  const minQty = parseInt(selectedService.min)
  const maxQty = parseInt(selectedService.max)
  const qtyNum = parseInt(orderQuantity) || 0
  const rate = parseFloat(selectedService.rate)

  const detectedPlatform = useMemo(() => detectPlatformFromUrl(orderLink), [orderLink])

  const servicePlatform = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'all') return null
    const cat = selectedCategory.toLowerCase()
    if (cat.includes('instagram')) return 'instagram'
    if (cat.includes('youtube')) return 'youtube'
    if (cat.includes('tiktok')) return 'tiktok'
    if (cat.includes('facebook')) return 'facebook'
    if (cat.includes('telegram')) return 'telegram'
    if (cat.includes('spotify')) return 'spotify'
    return null
  }, [selectedCategory])

  const platformMatch = !detectedPlatform || !servicePlatform || detectedPlatform === servicePlatform

  const linkValid = orderLink.length > 3 && (orderLink.startsWith('http') || orderLink.startsWith('@'))
  const quantityValid = qtyNum >= minQty && qtyNum <= maxQty

  const getQuantityError = () => {
    if (!quantityTouched || quantityValid) return null
    if (qtyNum < minQty) return `Minimum is ${minQty.toLocaleString()}`
    if (qtyNum > maxQty) return `Maximum is ${maxQty.toLocaleString()}`
    return null
  }
  const quantityError = getQuantityError()

  const quickQuantities = useMemo(() => {
    const values = [
      minQty,
      Math.round(minQty + (maxQty - minQty) * 0.25),
      Math.round(minQty + (maxQty - minQty) * 0.5),
      Math.round(minQty + (maxQty - minQty) * 0.75),
    ]
    return values.filter((v, i, arr) => v > 0 && arr.indexOf(v) === i).slice(0, 4)
  }, [minQty, maxQty])

  // const avgDeliveryHours = selectedService.avg_time ? parseInt(selectedService.avg_time) : null

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
            Link
            {linkValid && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
        </label>
        <div className="relative">
          <Input
            placeholder="https://instagram.com/username"
            value={orderLink}
            onChange={(e) => setOrderLink(e.target.value)}
            onBlur={() => setLinkTouched(true)}
            className={`${linkValid ? 'border-emerald-500/50 focus-visible:ring-emerald-500/30' : ''} ${!platformMatch ? 'border-amber-500' : ''}`}
          />
          {linkValid && (
            <a
              href={orderLink.startsWith('http') ? orderLink : `https://${orderLink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
        {detectedPlatform && (
          <p className={`text-xs flex items-center gap-1.5 ${platformMatch ? 'text-emerald-500' : 'text-amber-500'}`}>
            {platformMatch ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            Detected: {PLATFORM_LABELS[detectedPlatform] || detectedPlatform}
            {!platformMatch && servicePlatform && ` (expected ${PLATFORM_LABELS[servicePlatform] || servicePlatform})`}
          </p>
        )}
        {!detectedPlatform && linkTouched && !linkValid && (
          <p className="text-xs text-destructive flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3" />
            Enter a valid link (e.g., https://instagram.com/username)
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
            Quantity
            {quantityValid && quantityTouched && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
        </label>
        <Input
          type="number"
          min={minQty}
          max={maxQty}
          value={orderQuantity}
          onChange={(e) => setOrderQuantity(e.target.value)}
          onBlur={() => setQuantityTouched(true)}
          className={`h-11 text-base ${quantityError ? 'border-destructive focus-visible:ring-destructive/30' : quantityValid ? 'border-emerald-500/50 focus-visible:ring-emerald-500/30' : ''}`}
        />
        {quantityError ? (
          <p className="text-xs text-destructive flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3" />
            {quantityError}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Min: {minQty.toLocaleString()} | Max: {maxQty.toLocaleString()}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {quickQuantities.map((q) => (
            <Button
              key={q}
              type="button"
              variant={orderQuantity === String(q) ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setOrderQuantity(String(q)); setQuantityTouched(true) }}
              className={`h-8 text-xs ${orderQuantity === String(q) ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
            >
              {q >= 1000 ? `${(q/1000).toFixed(q % 1000 === 0 ? 0 : 1)}K` : q.toLocaleString()}
            </Button>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-lg bg-muted">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-muted-foreground">Rate per 1,000:</span>
          <span className="font-medium">₹{rate.toFixed(4)}</span>
        </div>
        {/* {avgDeliveryHours && (
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Est. delivery:
            </span>
            <span className="font-medium text-emerald-500">
              {avgDeliveryHours < 1 ? 'Under 1 hour' : avgDeliveryHours < 24 ? `~${avgDeliveryHours}h` : `~${Math.ceil(avgDeliveryHours / 24)} days`}
            </span>
          </div>
        )} */}
        {walletBalance !== undefined && (
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Your balance:</span>
            <span className={`font-medium ${walletBalance >= calculatePrice() ? 'text-emerald-500' : 'text-amber-500'}`}>
              {formatCurrencyByCode(walletBalance, walletCurrency!)}
            </span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between">
          <span className="font-medium">Total:</span>
          <span className="font-bold text-lg text-emerald-500">₹{calculatePrice()}</span>
        </div>
      </div>
    </div>
  )
}
