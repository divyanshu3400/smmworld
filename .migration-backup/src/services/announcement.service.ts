import { supabase } from '@/lib/supabase'
import { handleSupabaseError } from '@/lib/error-handler'
import type { Announcement } from '@/types/database'

export async function getActiveAnnouncements(): Promise<Announcement[]> {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .not('published_at', 'is', null)
    .lte('published_at', now)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('published_at', { ascending: false })

  if (error) throw handleSupabaseError(error)
  return data || []
}

export async function getRecentAnnouncements(
  limit: number = 5
): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) throw handleSupabaseError(error)
  return data || []
}
