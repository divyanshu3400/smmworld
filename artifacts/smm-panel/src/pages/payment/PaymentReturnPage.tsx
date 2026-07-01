import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CircleCheck as CheckCircle2, Circle as XCircle, Loader as Loader2, Wallet, ShoppingBag } from 'lucide-react'
import { verifyPaymentOnce, type PaymentResult } from '@/hooks/usePaymentVerification'
import { getCurrencySymbol, type CurrencyCode } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type PaymentFlow = 'wallet_topup' | 'public_order' | 'guest_order'

export default function PaymentReturnPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [result, setResult] = useState<PaymentResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const orderId = searchParams.get('order_id')
  const flow = (searchParams.get('flow') as PaymentFlow) || 'wallet_topup'
  const returnTo = searchParams.get('returnTo')

  useEffect(() => {
    if (!orderId) {
      setStatus('failed')
      setError('Missing order ID')
      return
    }

    verifyPaymentOnce(orderId)
      .then((res) => {
        setResult(res)
        if (res.success) {
          setStatus('success')
        } else {
          setStatus('failed')
          setError(res.message || 'Payment was not completed')
        }
      })
      .catch((err) => {
        setStatus('failed')
        setError(err instanceof Error ? err.message : 'Payment verification failed')
      })
  }, [orderId])

  const handleContinue = () => {
    if (returnTo) {
      window.location.href = decodeURIComponent(returnTo)
      return
    }

    switch (flow) {
      case 'wallet_topup':
        navigate('/wallet')
        break
      case 'public_order':
        navigate('/orders')
        break
      default:
        navigate('/')
    }
  }

  const currencySymbol = getCurrencySymbol((result?.currency as CurrencyCode) || 'INR')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-xl">
          <CardContent className="pt-8 pb-6 px-6">
            {status === 'loading' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-semibold">Verifying Payment</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please wait while we confirm your payment...
                  </p>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-emerald-600">Payment Successful!</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {flow === 'wallet_topup' && (
                      <>
                        {currencySymbol}{result?.amountINR?.toFixed(2) || '0'} has been added to your wallet.
                      </>
                    )}
                    {(flow === 'public_order' || flow === 'guest_order') && (
                      <>
                        Your order has been placed and will be processed shortly.
                      </>
                    )}
                  </p>
                </div>

                <div className="w-full rounded-lg bg-muted p-4 mt-2">
                  <div className="flex items-center gap-3">
                    {flow === 'wallet_topup' ? (
                      <Wallet className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <ShoppingBag className="h-5 w-5 text-emerald-500" />
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="font-semibold">
                        {currencySymbol}{result?.amountINR?.toFixed(2) || '0'}
                      </p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleContinue} className="w-full bg-emerald-500 hover:bg-emerald-600 mt-2">
                  {flow === 'wallet_topup' && (returnTo ? 'Continue' : 'Go to Wallet')}
                  {(flow === 'public_order' || flow === 'guest_order') && 'View Orders'}
                </Button>
              </div>
            )}

            {status === 'failed' && (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-red-600">Payment Failed</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {error || 'Something went wrong with your payment. Please try again.'}
                  </p>
                </div>

                <div className="flex gap-3 w-full mt-2">
                  <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
                    Home
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          {flow === 'wallet_topup' && 'Wallet Top-up'}
          {(flow === 'public_order' || flow === 'guest_order') && 'Order Payment'}
          {orderId && <span className="block mt-1">Order: {orderId.slice(0, 8)}...</span>}
        </p>
      </motion.div>
    </div>
  )
}
