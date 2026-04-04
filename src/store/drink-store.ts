import { create } from 'zustand';
import type { DrinkStoreState, LeaderboardEntry, DrinkLogEntry } from '@/types';
import type { User } from '@/types';
import { DRINK_CATALOG } from '@/data/mock-drinks';
import { MOCK_USERS, CURRENT_USER } from '@/data/mock-users';

function buildInitialLeaderboard(): LeaderboardEntry[] {
  return MOCK_USERS.map((user: User, index: number) => ({
    userId: user.id,
    rank: index + 1,
    drinkCount: Math.max(0, 8 - index),
    xp: user.xp,
    period: 'tonight' as const,
  }))
    .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.drinkCount - a.drinkCount)
    .map((entry: LeaderboardEntry, i: number) => ({ ...entry, rank: i + 1 }));
}

export const useDrinkStore = create<DrinkStoreState>()((set) => ({
  catalog: DRINK_CATALOG,
  log: [],
  leaderboard: buildInitialLeaderboard(),
  leaderboardPeriod: 'tonight',

  addDrink: (catalogItemId: string) =>
    set((state: DrinkStoreState) => {
      const entry: DrinkLogEntry = {
        id: crypto.randomUUID(),
        catalogItemId,
        loggedAt: new Date().toISOString(),
        userId: CURRENT_USER.id,
      };
      return { log: [...state.log, entry] };
    }),

  removeDrink: (entryId: string) =>
    set((state: DrinkStoreState) => ({
      log: state.log.filter((e: DrinkLogEntry) => e.id !== entryId),
    })),

  setLeaderboardPeriod: (period: DrinkStoreState['leaderboardPeriod']) =>
    set(() => ({ leaderboardPeriod: period })),
}));
