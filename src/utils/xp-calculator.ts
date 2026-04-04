const BASE_XP_PER_DRINK = 10;

/**
 * XP awarded for logging one drink.
 * Base 10 + 1 per streak weekend.
 */
export function xpForDrink(streakWeekends: number): number {
  return BASE_XP_PER_DRINK + streakWeekends;
}

/**
 * Minimum XP required to reach `level`.
 * threshold(level) = level * level * 100
 */
export function levelThreshold(level: number): number {
  return level * level * 100;
}

/**
 * Returns the highest level where levelThreshold(level) <= xp.
 * Scans levels 1–100.
 */
export function xpToLevel(xp: number): number {
  let level = 0;
  for (let l = 1; l <= 100; l++) {
    if (levelThreshold(l) <= xp) {
      level = l;
    } else {
      break;
    }
  }
  return level;
}
