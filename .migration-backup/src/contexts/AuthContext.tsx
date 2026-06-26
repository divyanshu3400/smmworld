import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getProfile, signInWithEmail, signUpWithEmail, signOut as authSignOut, signInWithGoogle, resetPassword, updatePassword } from '@/services/auth.service'
import type { Profile } from '@/types/database'
import type { LoginCredentials, SignupCredentials } from '@/types/auth'
import { handleSupabaseError } from '@/lib/error-handler'

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  signup: (credentials: SignupCredentials) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  refreshProfile: () => Promise<void>
  clearError: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      try {
        const profileData = await getProfile(user.id)
        setProfile(profileData)
      } catch (err) {
        console.error('Failed to fetch profile:', err)
      }
    }
  }, [user?.id])

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (currentSession) {
          setSession(currentSession)
          setUser(currentSession.user)
          const profileData = await getProfile(currentSession.user.id)
          setProfile(profileData)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
      } finally {
        if (mounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(newSession)
          setUser(newSession?.user ?? null)
          if (newSession?.user) {
            const profileData = await getProfile(newSession.user.id)
            setProfile(profileData)
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    setLoading(true)
    setError(null)
    try {
      const data = await signInWithEmail(credentials)
      setSession(data.session)
      setUser(data.user)
      const profileData = await getProfile(data.user.id)
      setProfile(profileData)
    } catch (err) {
      const appError = handleSupabaseError(err)
      setError(appError.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const signup = useCallback(async (credentials: SignupCredentials) => {
    setLoading(true)
    setError(null)
    try {
      await signUpWithEmail(credentials)
    } catch (err) {
      const appError = handleSupabaseError(err)
      setError(appError.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const loginWithGoogle = useCallback(async () => {
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      const appError = handleSupabaseError(err)
      setError(appError.message)
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await authSignOut()
      setSession(null)
      setUser(null)
      setProfile(null)
    } catch (err) {
      const appError = handleSupabaseError(err)
      setError(appError.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const requestPasswordReset = useCallback(async (email: string) => {
    setLoading(true)
    setError(null)
    try {
      await resetPassword(email)
    } catch (err) {
      const appError = handleSupabaseError(err)
      setError(appError.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const handleUpdatePassword = useCallback(async (newPassword: string) => {
    setLoading(true)
    setError(null)
    try {
      await updatePassword(newPassword)
    } catch (err) {
      const appError = handleSupabaseError(err)
      setError(appError.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      initialized,
      error,
      login,
      signup,
      loginWithGoogle,
      logout,
      requestPasswordReset,
      updatePassword: handleUpdatePassword,
      refreshProfile,
      clearError,
    }),
    [
      user,
      session,
      profile,
      loading,
      initialized,
      error,
      login,
      signup,
      loginWithGoogle,
      logout,
      requestPasswordReset,
      handleUpdatePassword,
      refreshProfile,
      clearError,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
