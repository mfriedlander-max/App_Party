import { getSupabaseClient } from '@/lib/supabase'

export interface AchievementRow {
  id: string
  name: string
  description: string
  emoji: string
  criteria: Record<string, unknown>
  created_at: string
}

export interface UserAchievementRow {
  user_id: string
  achievement_id: string
  unlocked_at: string
  achievements: AchievementRow
}

export async function fetchAchievements(): Promise<AchievementRow[]> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('achievements')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch achievements: ${error.message}`)
  }

  return (data ?? []) as AchievementRow[]
}

export async function fetchUserAchievements(userId: string): Promise<UserAchievementRow[]> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('user_achievements')
    .select('user_id, achievement_id, unlocked_at, achievements(*)')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch user achievements: ${error.message}`)
  }

  return (data ?? []) as unknown as UserAchievementRow[]
}

export async function unlockAchievement(
  userId: string,
  achievementId: string,
): Promise<void> {
  const client = getSupabaseClient()
  const { error } = await client
    .from('user_achievements')
    .insert({ user_id: userId, achievement_id: achievementId })

  if (error) {
    // Ignore duplicate — user already has this achievement
    if (!error.message.includes('duplicate') && !error.code?.includes('23505')) {
      throw new Error(`Failed to unlock achievement: ${error.message}`)
    }
  }
}

export async function updateStreak(
  userId: string,
  streakWeekends: number,
  lastActiveWeekend: string,
): Promise<void> {
  const client = getSupabaseClient()
  const { error } = await client
    .from('profiles')
    .update({ streak_weekends: streakWeekends, last_active_weekend: lastActiveWeekend })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to update streak: ${error.message}`)
  }
}
