import type { ConsumptionLogRow } from '@/lib/repositories/drink-repository'

const GENDER_CONSTANT: Record<'male' | 'female', number> = {
  male: 0.68,
  female: 0.55,
}

const METABOLISM_RATE = 0.015

interface BACProfile {
  weightKg: number
  biologicalSex: 'male' | 'female'
}

/**
 * Computes current BAC using the Widmark formula from Supabase consumption_log rows.
 *
 * Uses aggregate approach: sum all standard drinks, then subtract metabolism
 * based on hours since the first drink was consumed.
 *
 * BAC = totalStdDrinks / (weightKg * genderConstant) - 0.015 * hoursElapsed
 *
 * Result is clamped to >= 0.
 */
export function computeBAC(
  logs: ConsumptionLogRow[],
  profile: BACProfile,
): number {
  if (logs.length === 0 || profile.weightKg <= 0) return 0

  const now = Date.now()
  const genderConstant = GENDER_CONSTANT[profile.biologicalSex]

  // Total standard drinks across all log entries (1 std drink = 14g alcohol)
  const totalStandardDrinks = logs.reduce(
    (sum, entry) => sum + entry.estimated_alcohol_grams / 14,
    0,
  )

  // Use the earliest logged_at as the reference for elapsed time
  const earliestLoggedAt = logs.reduce((earliest, entry) => {
    const t = new Date(entry.logged_at).getTime()
    return t < earliest ? t : earliest
  }, new Date(logs[0].logged_at).getTime())

  const hoursElapsed = Math.max(0, (now - earliestLoggedAt) / 3_600_000)

  const raw =
    totalStandardDrinks / (profile.weightKg * genderConstant) -
    METABOLISM_RATE * hoursElapsed

  return Math.max(0, raw)
}
