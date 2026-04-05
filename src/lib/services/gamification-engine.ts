import {
  fetchAchievements,
  fetchUserAchievements,
  unlockAchievement,
  type AchievementRow,
} from '@/lib/repositories/gamification-repository'

export interface AchievementContext {
  drinkCount: number
  friendCount: number
  streak: number
  drinkTypes: string[]
  /** Hour of last logged drink (0-23), used for Night Owl check */
  lastDrinkHour?: number
  /** Whether the user opened the app tonight but logged zero drinks */
  soberNight?: boolean
}

/**
 * Maps a Supabase AchievementRow to an app-level Badge shape.
 */
export interface UnlockedAchievement {
  id: string
  name: string
  description: string
  emoji: string
}

function rowToUnlocked(row: AchievementRow): UnlockedAchievement {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    emoji: row.emoji,
  }
}

/**
 * Checks whether the user qualifies for any new achievements given the
 * current context, inserts the newly earned ones into user_achievements,
 * and returns the list of newly unlocked achievements for UI celebration.
 */
export async function checkAndUnlockAchievements(
  userId: string,
  context: AchievementContext,
): Promise<UnlockedAchievement[]> {
  const [allAchievements, userAchievements] = await Promise.all([
    fetchAchievements(),
    fetchUserAchievements(userId),
  ])

  const alreadyUnlocked = new Set(userAchievements.map((ua) => ua.achievement_id))

  // Build a lookup map: achievement name → row
  const byName = new Map<string, AchievementRow>(
    allAchievements.map((a) => [a.name, a]),
  )

  const shouldUnlock: AchievementRow[] = []

  function check(name: string, condition: boolean): void {
    const row = byName.get(name)
    if (row && condition && !alreadyUnlocked.has(row.id)) {
      shouldUnlock.push(row)
    }
  }

  // Count unique cocktails and unique beers
  const lowerTypes = context.drinkTypes.map((t) => t.toLowerCase())
  const uniqueCocktails = new Set(lowerTypes.filter((t) => t.includes('cocktail') || t.includes('margarita') || t.includes('martini') || t.includes('mojito') || t.includes('daiquiri')))
  const uniqueBeers = new Set(lowerTypes.filter((t) => t.includes('beer') || t.includes('lager') || t.includes('ale') || t.includes('stout') || t.includes('ipa')))

  check('First Drink', context.drinkCount >= 1)
  check('Party Starter', context.friendCount >= 0) // triggered externally via context
  check('Social Butterfly', context.friendCount >= 5)
  check('Mixologist', uniqueCocktails.size >= 5)
  check('Beer Connoisseur', uniqueBeers.size >= 5)
  check('Weekend Warrior', context.streak >= 3)
  check('Night Owl', context.lastDrinkHour !== undefined && context.lastDrinkHour >= 2)
  check('Hydration Hero', context.soberNight === true)

  if (shouldUnlock.length === 0) return []

  // Persist all new unlocks (best-effort — ignore individual failures)
  await Promise.all(
    shouldUnlock.map((row) =>
      unlockAchievement(userId, row.id).catch(() => {
        // Ignore individual unlock failures — achievements are non-critical
      }),
    ),
  )

  return shouldUnlock.map(rowToUnlocked)
}
