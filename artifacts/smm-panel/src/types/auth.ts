import type { User, Session } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  profile: import('./database').Profile | null
  loading: boolean
  error: string | null
  initialized: boolean
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface SignupCredentials {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface OAuthResponse {
  success: boolean
  error?: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordUpdateRequest {
  currentPassword: string
  newPassword: string
}

export type AuthError = {
  message: string
  code?: string
}
