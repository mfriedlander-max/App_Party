import type { DrinkLogEntry, DrinkCatalogItem } from '@/types';
import type { User } from '@/types';

const GENDER_CONSTANT: Record<'male' | 'female', number> = {
  male: 0.68,
  female: 0.55,
};

const METABOLISM_RATE = 0.015;

interface BACParams {
  standardDrinks: number;
  weightKg: number;
  biologicalSex: 'male' | 'female';
  hoursElapsed: number;
}

/**
 * Widmark formula: BAC = (standardDrinks * 14) / (weightKg * 1000 * genderConstant) - (0.015 * hoursElapsed)
 * Result is clamped to >= 0.
 */
export function calculateBAC({ standardDrinks, weightKg, biologicalSex, hoursElapsed }: BACParams): number {
  if (weightKg <= 0) return 0;

  const clampedHours = Math.max(0, hoursElapsed);
  const genderConstant = GENDER_CONSTANT[biologicalSex];
  // Widmark: BAC (g/dL) = standardDrinks / (weightKg * genderConstant) - 0.015 * hoursElapsed
  const raw = standardDrinks / (weightKg * genderConstant) - METABOLISM_RATE * clampedHours;

  return Math.max(0, raw);
}

/**
 * Computes the current BAC by summing contributions of each drink log entry,
 * accounting for elapsed time since each drink was logged.
 */
export function computeCurrentBAC(
  log: readonly DrinkLogEntry[],
  catalog: readonly DrinkCatalogItem[],
  user: Pick<User, 'weightKg' | 'biologicalSex'>,
): number {
  if (log.length === 0 || user.weightKg <= 0) return 0;

  const now = Date.now();
  const genderConstant = GENDER_CONSTANT[user.biologicalSex];

  const totalBAC = log.reduce((sum, entry) => {
    const item = catalog.find((c) => c.id === entry.catalogItemId);
    if (!item) return sum;

    const hoursElapsed = Math.max(0, (now - new Date(entry.loggedAt).getTime()) / 3_600_000);
    const raw = item.standardDrinks / (user.weightKg * genderConstant) - METABOLISM_RATE * hoursElapsed;
    return sum + Math.max(0, raw);
  }, 0);

  return Math.max(0, totalBAC);
}
