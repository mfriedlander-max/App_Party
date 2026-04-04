import { describe, it, expect, beforeEach } from 'vitest';
import { useDrinkStore } from '@/store/drink-store';
import type { DrinkStoreState, DrinkLogEntry } from '@/types';

beforeEach(() => {
  useDrinkStore.setState((state: DrinkStoreState) => ({
    ...state,
    log: [],
  }));
});

describe('useDrinkStore — addDrink', () => {
  it('creates a new log array (referential inequality)', () => {
    const before = useDrinkStore.getState().log;
    const catalogId = useDrinkStore.getState().catalog[0].id;
    useDrinkStore.getState().addDrink(catalogId);
    const after = useDrinkStore.getState().log;
    expect(after).not.toBe(before);
  });

  it('adds one entry to the log', () => {
    const catalogId = useDrinkStore.getState().catalog[0].id;
    useDrinkStore.getState().addDrink(catalogId);
    expect(useDrinkStore.getState().log).toHaveLength(1);
  });

  it('log entry has catalogItemId, loggedAt, userId, and id', () => {
    const catalogItem = useDrinkStore.getState().catalog[0];
    useDrinkStore.getState().addDrink(catalogItem.id);
    const entry = useDrinkStore.getState().log[0];
    expect(entry.catalogItemId).toBe(catalogItem.id);
    expect(typeof entry.id).toBe('string');
    expect(typeof entry.loggedAt).toBe('string');
    expect(typeof entry.userId).toBe('string');
  });
});

describe('useDrinkStore — removeDrink', () => {
  it('removes the correct entry by id', () => {
    const catalogId = useDrinkStore.getState().catalog[0].id;
    useDrinkStore.getState().addDrink(catalogId);
    useDrinkStore.getState().addDrink(catalogId);
    const idToRemove = useDrinkStore.getState().log[0].id;
    useDrinkStore.getState().removeDrink(idToRemove);
    const log = useDrinkStore.getState().log;
    expect(log).toHaveLength(1);
    expect(log.find((e: DrinkLogEntry) => e.id === idToRemove)).toBeUndefined();
  });

  it('creates a new log array on remove (immutable)', () => {
    const catalogId = useDrinkStore.getState().catalog[0].id;
    useDrinkStore.getState().addDrink(catalogId);
    const before = useDrinkStore.getState().log;
    useDrinkStore.getState().removeDrink(before[0].id);
    const after = useDrinkStore.getState().log;
    expect(after).not.toBe(before);
  });
});

describe('useDrinkStore — leaderboard', () => {
  it('leaderboard has entries', () => {
    expect(useDrinkStore.getState().leaderboard.length).toBeGreaterThan(0);
  });

  it('leaderboard is sorted descending by drinkCount', () => {
    const lb = useDrinkStore.getState().leaderboard;
    for (let i = 1; i < lb.length; i++) {
      expect(lb[i - 1].drinkCount).toBeGreaterThanOrEqual(lb[i].drinkCount);
    }
  });

  it('setLeaderboardPeriod updates the period', () => {
    useDrinkStore.getState().setLeaderboardPeriod('alltime');
    expect(useDrinkStore.getState().leaderboardPeriod).toBe('alltime');
  });
});
