import { getSupabaseClient } from '@/lib/supabase'
import type { Profile } from '@/hooks/use-auth'

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to fetch profile: ${error.message}`)
  }

  return data as Profile
}

export async function updateProfile(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>,
): Promise<Profile> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`)
  }

  return data as Profile
}

export async function awardXP(userId: string, amount: number): Promise<Profile> {
  // Fetch current xp then update — avoids needing a custom RPC function
  const profile = await fetchProfile(userId)
  if (!profile) {
    throw new Error(`Profile not found for user ${userId}`)
  }
  return updateProfile(userId, { xp: profile.xp + amount })
}
