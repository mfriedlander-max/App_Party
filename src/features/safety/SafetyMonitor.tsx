import { useCallback, useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { useDrinkStore } from '@/store/drink-store';
import { useTimer } from '@/hooks/use-timer';
import { calculateBAC } from '@/utils/bac-calculator';
import type { SafetyLevel } from '@/types';

const CHECK_INTERVAL_MS = 30_000;

/**
 * Pure function exported for testing.
 * Returns the safety level for a given BAC, or null if safe.
 */
export function getSafetyLevel(bac: number): Exclude<SafetyLevel, 'safe'> | null {
  if (bac >= 0.08) return 'danger';
  if (bac >= 0.06) return 'warning';
  return null;
}

/**
 * Invisible component — mounts at app root and monitors BAC every 30 seconds.
 * Adds safety alerts to the app store; deduplicates by level.
 */
export function SafetyMonitor() {
  const log = useDrinkStore((s) => s.log);
  const catalog = useDrinkStore((s) => s.catalog);
  const currentUser = useAppStore((s) => s.currentUser);
  const notifications = useAppStore((s) => s.notifications);
  const addSafetyAlert = useAppStore((s) => s.addSafetyAlert);

  const computeCurrentBAC = useCallback((): number => {
    const now = Date.now();
    const totalStandardDrinks = log.reduce((sum, entry) => {
      const item = catalog.find((c) => c.id === entry.catalogItemId);
      return sum + (item?.standardDrinks ?? 0);
    }, 0);

    if (totalStandardDrinks === 0) return 0;

    const firstDrinkMs = Math.min(...log.map((e) => new Date(e.loggedAt).getTime()));
    const hoursElapsed = (now - firstDrinkMs) / 3_600_000;

    return calculateBAC({
      standardDrinks: totalStandardDrinks,
      weightKg: currentUser.weightKg,
      biologicalSex: currentUser.biologicalSex,
      hoursElapsed,
    });
  }, [log, catalog, currentUser]);

  const hasActiveAlert = useCallback(
    (level: Exclude<SafetyLevel, 'safe'>): boolean =>
      notifications.some((n) => n.level === level && !n.acknowledged),
    [notifications],
  );

  const check = useCallback(() => {
    const bac = computeCurrentBAC();
    const level = getSafetyLevel(bac);

    if (level === null) return;

    if (hasActiveAlert(level)) return;

    const message =
      level === 'warning'
        ? 'Your BAC is getting high. Consider slowing down and drinking some water.'
        : 'Your BAC is above the legal limit. Stop drinking and stay safe.';

    addSafetyAlert({ level, message, acknowledged: false });
  }, [computeCurrentBAC, hasActiveAlert, addSafetyAlert]);

  // Memoize to prevent useTimer from restarting on every render
  const stableCheck = useMemo(() => check, [check]);

  useTimer(stableCheck, CHECK_INTERVAL_MS, true);

  return null;
}
