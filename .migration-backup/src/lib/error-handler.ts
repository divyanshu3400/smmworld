import { AuthError } from '@supabase/supabase-js'

export interface AppError {
  message: string
  code?: string
  details?: unknown
}

export function handleSupabaseError(error: unknown): AppError {
  if (error instanceof AuthError) {
    switch (error.message) {
      case 'Invalid login credentials':
        return { message: 'Invalid email or password', code: 'invalid_credentials' }
      case 'Email not confirmed':
        return { message: 'Please verify your email address', code: 'email_not_verified' }
      case 'User already registered':
        return { message: 'An account with this email already exists', code: 'email_exists' }
      case 'Password should be at least 6 characters':
        return { message: 'Password must be at least 6 characters', code: 'weak_password' }
      case 'Unable to validate email address: invalid format':
        return { message: 'Please enter a valid email address', code: 'invalid_email' }
      default:
        return { message: error.message, code: error.status?.toString() }
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch')) {
      return { message: 'Network error. Please check your connection.', code: 'network_error' }
    }
    return { message: error.message }
  }

  return { message: 'An unexpected error occurred' }
}

export function getErrorMessage(error: unknown): string {
  return handleSupabaseError(error).message
}

export function createAppError(message: string, code?: string): AppError {
  return { message, code }
}

export class ApiError extends Error {
  code: string
  status: number

  constructor(message: string, code: string = 'unknown', status: number = 500) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}
