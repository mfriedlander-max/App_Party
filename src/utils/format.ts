/**
 * Formats a BAC value to 2 decimal places.
 * e.g. 0.082 → "0.08"
 */
export function formatBAC(bac: number): string {
  return bac.toFixed(2);
}

/**
 * Formats a time (Date or ISO string) to h:mm AM/PM.
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/**
 * Formats an XP number with K/M suffixes.
 * e.g. 1500 → "1.5K", 1000000 → "1M"
 */
export function formatXP(xp: number): string {
  if (xp >= 1_000_000) {
    const val = xp / 1_000_000;
    return `${val % 1 === 0 ? val.toFixed(0) : val}M`;
  }
  if (xp >= 1000) {
    const val = xp / 1000;
    return `${val % 1 === 0 ? val.toFixed(0) : val}K`;
  }
  return String(xp);
}

/**
 * Formats a drink count with singular/plural.
 * e.g. 1 → "1 drink", 7 → "7 drinks"
 */
export function formatDrinkCount(count: number): string {
  return count === 1 ? '1 drink' : `${count} drinks`;
}
