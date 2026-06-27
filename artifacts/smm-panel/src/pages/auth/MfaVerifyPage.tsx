import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Loader as Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { toast } from 'sonner'
import { listFactors, createChallenge, verifyChallenge, type MFAFactor } from '@/services/mfa.service'

export default function MfaVerifyPage() {
  const navigate = useNavigate()
  const [factors, setFactors] = useState<MFAFactor[]>([])
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)

  const fetchFactors = useCallback(async () => {
    try {
      const list = await listFactors()
      const verified = list.filter((f) => f.status === 'verified')
      setFactors(verified)
      if (verified.length === 0) {
        toast.error('No verified 2FA factors found')
        navigate('/login', { replace: true })
      }
    } catch {
      toast.error('Failed to load 2FA factors')
      navigate('/login', { replace: true })
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    fetchFactors()
  }, [fetchFactors])

  const handleVerify = async () => {
    if (code.length !== 6 || factors.length === 0) return
    setVerifying(true)
    try {
      const factor = factors[0]
      const challengeId = await createChallenge(factor.id)
      await verifyChallenge(factor.id, challengeId, code)
      toast.success('Verification successful')
      navigate('/dashboard', { replace: true })
    } catch {
      toast.error('Invalid code. Please try again.')
      setCode('')
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 mb-4">
          <Shield className="h-7 w-7 text-emerald-500" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">Two-factor authentication</h2>
        <p className="mt-2 text-muted-foreground">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col items-center">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(v) => setCode(v)}
            disabled={verifying}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
              <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
              <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
              <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
              <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
              <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          className="w-full bg-emerald-500 hover:bg-emerald-600"
          onClick={handleVerify}
          disabled={code.length !== 6 || verifying}
        >
          {verifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify'
          )}
        </Button>

        <button
          onClick={() => navigate('/login', { replace: true })}
          className="flex items-center justify-center gap-1.5 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </button>
      </div>
    </motion.div>
  )
}
