import { supabase } from '@/lib/supabase'
import { handleSupabaseError } from '@/lib/error-handler'
import type { LoginCredentials, SignupCredentials } from '@/types/auth'
import type { Profile } from '@/types/database'

export async function signInWithEmail(credentials: LoginCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  })

  if (error) throw handleSupabaseError(error)
  return data
}

export async function signUpWithEmail(credentials: SignupCredentials) {
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        first_name: credentials.firstName,
        last_name: credentials.lastName,
      },
    },
  })

  if (error) throw handleSupabaseError(error)
  return data
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw handleSupabaseError(error)
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw handleSupabaseError(error)
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) throw handleSupabaseError(error)
  return data
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) throw handleSupabaseError(error)
  return data
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw handleSupabaseError(error)
  return session
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw handleSupabaseError(error)
  }
  return data as Profile
}

export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<Profile> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw handleSupabaseError(error)
  return data as Profile
}

export async function resendVerificationEmail(email: string) {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
  })

  if (error) throw handleSupabaseError(error)
  return data
}

export async function verifyEmail(token: string, type: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: type as 'signup' | 'email_change',
  })

  if (error) throw handleSupabaseError(error)
  return data
}

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/avatar.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true })

  if (uploadError) throw handleSupabaseError(uploadError)

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)

  await updateProfile(userId, { avatar_url: publicUrl })

  return publicUrl
}

export async function deleteAccount(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (error) throw handleSupabaseError(error)
}
