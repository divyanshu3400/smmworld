// src/components/orders/OrderDetailsForm.tsx
import { Input } from '@/components/ui/input'
import { formatCurrencyByCode, type CurrencyCode } from '@/lib/currency'
import type { useOrderState } from '@/hooks/useOrderState'

type OrderState = ReturnType<typeof useOrderState>

function Separator() {
  return <div className="h-px bg-border my-2" />
}

export default function OrderDetailsForm({
  state, walletBalance, walletCurrency,
}: {
  state: OrderState
  walletBalance?: number
  walletCurrency?: CurrencyCode
}) {
  const { selectedService, orderLink, setOrderLink, orderQuantity, setOrderQuantity, calculatePrice } = state
  if (!selectedService) return null

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Link</label>
        <Input
          placeholder="https://instagram.com/username"
          value={orderLink}
          onChange={(e) => setOrderLink(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Quantity</label>
        <Input
          type="number"
          min={selectedService.min}
          max={selectedService.max}
          value={orderQuantity}
          onChange={(e) => setOrderQuantity(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Min: {parseInt(selectedService.min).toLocaleString()} | Max: {parseInt(selectedService.max).toLocaleString()}
        </p>
      </div>

      <div className="p-4 rounded-lg bg-muted">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-muted-foreground">Rate per 1,000:</span>
          <span className="font-medium">₹{parseFloat(selectedService.rate)}</span>
        </div>
        {walletBalance !== undefined && (
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Your balance:</span>
            <span className="font-medium">{formatCurrencyByCode(walletBalance, walletCurrency!)}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between">
          <span className="font-medium">Total:</span>
          <span className="font-bold text-emerald-500">₹{calculatePrice()}</span>
        </div>
      </div>
    </div>
  )
}