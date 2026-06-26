import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Handle OAuth callback
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          setError(sessionError.message)
          return
        }

        if (session) {
          // Check if there's an auth code in URL (for PKCE flow)
          const authCode = searchParams.get('code')
          if (authCode) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode)
            if (exchangeError) {
              setError(exchangeError.message)
              return
            }
          }

          // Successfully authenticated, redirect to dashboard
          navigate('/dashboard', { replace: true })
          return
        }

        // Check for error in URL params
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (errorParam) {
          setError(errorDescription || errorParam)
          return
        }

        // No session found, redirect to login
        navigate('/login', { replace: true })
      } catch (err) {
        setError('An unexpected error occurred during authentication')
        console.error('Auth callback error:', err)
      }
    }

    handleCallback()
  }, [navigate, searchParams])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Authentication Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mx-auto mb-4" />
        <h1 className="text-xl font-medium text-foreground">Completing authentication...</h1>
        <p className="text-muted-foreground mt-2">Please wait while we sign you in.</p>
      </div>
    </div>
  )
}
