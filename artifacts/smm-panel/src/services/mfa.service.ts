import { supabase } from '@/lib/supabase'
import { handleSupabaseError } from '@/lib/error-handler'

export interface MFAEnrollmentResponse {
  id: string
  type: 'totp'
  totp: {
    qr_code: string
    secret: string
    uri: string
  }
}

export interface MFAFactor {
  id: string
  friendly_name: string
  factor_type: 'totp'
  status: 'verified' | 'unverified'
  created_at: string
  updated_at: string
}

export async function enrollTOTP(friendlyName = 'Authenticator'): Promise<MFAEnrollmentResponse> {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName,
  })

  if (error) throw handleSupabaseError(error)
  return data as MFAEnrollmentResponse
}

export async function verifyTOTP(factorId: string, code: string): Promise<void> {
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId,
  })

  if (challengeError) throw handleSupabaseError(challengeError)

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  })

  if (verifyError) throw handleSupabaseError(verifyError)
}

export async function listFactors(): Promise<MFAFactor[]> {
  const { data, error } = await supabase.auth.mfa.listFactors()

  if (error) throw handleSupabaseError(error)
  return data.totp as MFAFactor[]
}

export async function unenrollFactor(factorId: string): Promise<void> {
  const { error } = await supabase.auth.mfa.unenroll({
    factorId,
  })

  if (error) throw handleSupabaseError(error)
}

export async function createChallenge(factorId: string): Promise<string> {
  const { data, error } = await supabase.auth.mfa.challenge({ factorId })

  if (error) throw handleSupabaseError(error)
  return data.id
}

export async function verifyChallenge(factorId: string, challengeId: string, code: string): Promise<void> {
  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  })

  if (error) throw handleSupabaseError(error)
}

export async function getAuthenticatorAssuranceLevel(): Promise<{
  currentLevel: 'aal1' | 'aal2' | null
  nextLevel: 'aal1' | 'aal2' | null
  currentAuthenticationMethods: string[]
}> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

  if (error) throw handleSupabaseError(error)
  return {
    currentLevel: data.currentLevel as 'aal1' | 'aal2' | null,
    nextLevel: data.nextLevel as 'aal1' | 'aal2' | null,
    currentAuthenticationMethods: data.currentAuthenticationMethods,
  }
}
