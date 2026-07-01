import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { apiUrl } from '@/lib/api'
import { getCurrencySymbol, type CurrencyCode } from '@/lib/currency'

export type PaymentState = 'idle' | 'creating' | 'waiting' | 'verifying' | 'done' | 'failed'

export interface PaymentResult {
  success: boolean
  status?: string
  message?: string
  alreadyCredited?: boolean
  duplicate?: boolean
  provider?: string
  amountINR?: number
  currency?: string
  newBalance?: number
}

async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token || null
}

export async function verifyGatewayPayment(orderId: string, token?: string): Promise<PaymentResult> {
  const authToken = token !== undefined ? token : await getAuthToken()

  // Use public verify endpoint if no auth token (for PaymentReturnPage)
  const endpoint = authToken ? '/api/payment/verify' : '/api/payment/verify-public'
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`

  const res = await fetch(apiUrl(endpoint), {
    method: 'POST',
    headers,
    body: JSON.stringify({ orderId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Payment verification failed')
  }
  return res.json()
}

export async function pollOrderStatus(orderId: string, token?: string): Promise<string> {
  const authToken = token !== undefined ? token : await getAuthToken()
  if (!authToken) {
    // Can't poll order status without auth - return pending
    return 'pending'
  }
  const res = await fetch(apiUrl(`/api/payment/order/${orderId}/status`), {
    headers: { Authorization: `Bearer ${authToken}` },
  })
  if (!res.ok) throw new Error('Failed to check order status')
  const data = await res.json()
  return data.status
}

export interface UsePaymentVerificationOptions {
  orderId: string | null
  currency?: CurrencyCode
  onSuccess?: (result: PaymentResult) => void
  onFailure?: (message: string) => void
  autoStart?: boolean
}

export interface UsePaymentVerificationReturn {
  paymentState: PaymentState
  statusMessage: string
  result: PaymentResult | null
  verify: () => Promise<void>
  reset: () => void
}

export function usePaymentVerification({
  orderId,
  currency = 'INR',
  onSuccess,
  onFailure,
  autoStart = true,
}: UsePaymentVerificationOptions): UsePaymentVerificationReturn {
  const queryClient = useQueryClient()
  const currencySymbol = getCurrencySymbol(currency)

  const [paymentState, setPaymentState] = useState<PaymentState>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [result, setResult] = useState<PaymentResult | null>(null)

  const verify = useCallback(async () => {
    if (!orderId) return
    setPaymentState('verifying')
    try {
      const res = await verifyGatewayPayment(orderId)
      if (res.success) {
        setPaymentState('done')
        setResult(res)
        queryClient.invalidateQueries({ queryKey: ['wallet'] })
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        onSuccess?.(res)
      } else {
        setPaymentState('waiting')
        setStatusMessage(res.message || 'Payment not confirmed yet. If you have paid, please wait a moment and try again.')
        onFailure?.(res.message || 'Payment not confirmed')
      }
    } catch (err) {
      setPaymentState('waiting')
      const msg = err instanceof Error ? err.message : 'Verification failed'
      setStatusMessage(msg)
      onFailure?.(msg)
    }
  }, [orderId, queryClient, onSuccess, onFailure])

  const reset = useCallback(() => {
    setPaymentState('idle')
    setStatusMessage('')
    setResult(null)
  }, [])

  // Auto-start verification when orderId is provided
  useEffect(() => {
    if (!orderId || !autoStart) return

    setPaymentState('verifying')
    verifyGatewayPayment(orderId).then((res) => {
      if (res.success) {
        setPaymentState('done')
        setResult(res)
        queryClient.invalidateQueries({ queryKey: ['wallet'] })
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        onSuccess?.(res)
      } else {
        setPaymentState('waiting')
        setStatusMessage(res.message || 'Payment not confirmed yet. Click verify if you have paid.')
      }
    }).catch(() => {
      setPaymentState('waiting')
      setStatusMessage('Could not verify automatically. Click verify if you have paid.')
    })
  }, [orderId, autoStart, queryClient, onSuccess])

  // Polling for waiting state
  useEffect(() => {
    if (paymentState !== 'waiting' || !orderId) return
    let cancelled = false
    const interval = setInterval(async () => {
      try {
        const status = await pollOrderStatus(orderId)
        if (cancelled) return
        if (status === 'paid') {
          clearInterval(interval)
          setPaymentState('verifying')
          const res = await verifyGatewayPayment(orderId)
          if (res.success) {
            setPaymentState('done')
            setResult(res)
            queryClient.invalidateQueries({ queryKey: ['wallet'] })
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            onSuccess?.(res)
          } else {
            setPaymentState('failed')
            setStatusMessage(res.message || 'Payment verification failed')
            onFailure?.(res.message || 'Payment verification failed')
          }
        } else if (status === 'failed') {
          clearInterval(interval)
          setPaymentState('failed')
          setStatusMessage('Payment failed. Please try again.')
          onFailure?.('Payment failed')
        }
      } catch {
        // keep polling
      }
    }, 4000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [paymentState, orderId, queryClient, onSuccess, onFailure])

  return {
    paymentState,
    statusMessage,
    result,
    verify,
    reset,
  }
}

// Helper for one-shot verification without polling (useful for return page)
export async function verifyPaymentOnce(orderId: string): Promise<PaymentResult> {
  return verifyGatewayPayment(orderId)
}
