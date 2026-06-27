import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, ShieldCheck, Loader as Loader2, QrCode, Copy, Check, KeyRound, Trash2, TriangleAlert as AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { toast } from 'sonner'
import {
  enrollTOTP,
  verifyTOTP,
  listFactors,
  unenrollFactor,
  type MFAFactor,
} from '@/services/mfa.service'

type Step = 'idle' | 'enrolling' | 'verifying' | 'done'

export default function TwoFactorAuth() {
  const [factors, setFactors] = useState<MFAFactor[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [step, setStep] = useState<Step>('idle')
  const [qrUrl, setQrUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [factorId, setFactorId] = useState('')
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [unenrollTarget, setUnenrollTarget] = useState<MFAFactor | null>(null)
  const [unenrollOpen, setUnenrollOpen] = useState(false)

  const fetchFactors = useCallback(async () => {
    setLoading(true)
    try {
      const list = await listFactors()
      setFactors(list)
    } catch {
      // silently fail - user may not have a session yet
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFactors()
  }, [fetchFactors])

  const verifiedFactors = factors.filter((f) => f.status === 'verified')
  const is2FAEnabled = verifiedFactors.length > 0

  const handleEnroll = async () => {
    setStep('enrolling')
    setCode('')
    try {
      const res = await enrollTOTP('Authenticator App')
      setQrUrl(res.totp.qr_code)
      setSecret(res.totp.secret)
      setFactorId(res.id)
      setStep('verifying')
    } catch {
      toast.error('Failed to start 2FA enrollment')
      setStep('idle')
    }
  }

  const handleVerify = async () => {
    if (code.length !== 6) return
    setStep('done')
    try {
      await verifyTOTP(factorId, code)
      toast.success('Two-factor authentication enabled')
      setDialogOpen(false)
      setStep('idle')
      setCode('')
      setQrUrl('')
      setSecret('')
      setFactorId('')
      fetchFactors()
    } catch {
      toast.error('Invalid verification code. Please try again.')
      setStep('verifying')
    }
  }

  const handleUnenroll = async () => {
    if (!unenrollTarget) return
    try {
      await unenrollFactor(unenrollTarget.id)
      toast.success('Two-factor authentication disabled')
      setUnenrollOpen(false)
      setUnenrollTarget(null)
      fetchFactors()
    } catch {
      toast.error('Failed to disable 2FA')
    }
  }

  const copySecret = () => {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const closeDialog = () => {
    if (step === 'enrolling' || step === 'done') return
    setDialogOpen(false)
    setStep('idle')
    setCode('')
    setQrUrl('')
    setSecret('')
    setFactorId('')
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {is2FAEnabled ? (
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            ) : (
              <Shield className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">
              {is2FAEnabled ? 'Enabled' : 'Not enabled'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {is2FAEnabled
              ? `${verifiedFactors.length} factor${verifiedFactors.length > 1 ? 's' : ''} active. Your account is protected with an authenticator app.`
              : 'Protect your account with an authenticator app like Google Authenticator or Authy.'}
          </p>
        </div>
        {is2FAEnabled ? (
          <Button
            variant="outline"
            onClick={() => {
              setUnenrollTarget(verifiedFactors[0])
              setUnenrollOpen(true)
            }}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Disable
          </Button>
        ) : (
          <Button
            className="bg-emerald-500 hover:bg-emerald-600"
            onClick={() => {
              setDialogOpen(true)
              handleEnroll()
            }}
            disabled={loading}
          >
            <KeyRound className="h-4 w-4 mr-2" />
            Enable
          </Button>
        )}
      </div>

      {/* Enrollment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              Set up two-factor authentication
            </DialogTitle>
            <DialogDescription>
              Secure your account with an authenticator app
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {step === 'enrolling' && (
              <motion.div
                key="enrolling"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-8"
              >
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                <p className="mt-4 text-sm text-muted-foreground">Preparing setup...</p>
              </motion.div>
            )}

            {step === 'verifying' && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <div className="flex flex-col items-center">
                  <div className="rounded-xl border-2 border-border p-4 bg-white">
                    <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground text-center">
                    Scan this QR code with your authenticator app
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">
                    Or enter this code manually:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-muted px-3 py-2 text-xs font-mono break-all">
                      {secret}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copySecret}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Enter the 6-digit code from your app
                  </label>
                  <InputOTP
                    maxLength={6}
                    value={code}
                    onChange={(v) => setCode(v)}
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
                  disabled={code.length !== 6 || step === 'done'}
                >
                  {step === 'done' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify and enable'
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Unenroll Confirmation Dialog */}
      <Dialog open={unenrollOpen} onOpenChange={setUnenrollOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Disable two-factor authentication?
            </DialogTitle>
            <DialogDescription>
              Your account will be less secure. You will no longer need a verification code when signing in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setUnenrollOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleUnenroll}>
              Yes, disable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
