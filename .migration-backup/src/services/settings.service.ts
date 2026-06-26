import { supabase } from '@/lib/supabase'
import { handleSupabaseError } from '@/lib/error-handler'
import type { UserSettings } from '@/types/database'

export async function getSettings(userId: string): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw handleSupabaseError(error)
  }
  return data as UserSettings
}

export async function updateSettings(
  userId: string,
  updates: Partial<UserSettings>
): Promise<UserSettings> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('user_settings')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw handleSupabaseError(error)
  return data as UserSettings
}
