import { create } from 'zustand';
import type { DrinkStoreState, LeaderboardEntry, DrinkLogEntry } from '@/types';
import type { User } from '@/types';
import { DRINK_CATALOG } from '@/data/mock-drinks';
import { MOCK_USERS, CURRENT_USER } from '@/data/mock-users';
import { fetchDrinkCatalog, logDrink, removeDrink as removeDrinkFromDb } from '@/lib/repositories/drink-repository';
import type { DrinkCatalogItem } from '@/types';

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

function catalogRowToCatalogItem(row: {
  id: string;
  name: string;
  category: DrinkCatalogItem['category'];
  emoji: string;
  abv: number;
  standard_volume_ml: number;
  standard_drinks: number;
}): DrinkCatalogItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    emoji: row.emoji,
    abv: row.abv,
    volumeMl: row.standard_volume_ml,
    standardDrinks: row.standard_drinks,
  };
}

export const useDrinkStore = create<DrinkStoreState>()((set, get) => ({
  catalog: DRINK_CATALOG,
  log: [],
  leaderboard: buildInitialLeaderboard(),
  leaderboardPeriod: 'tonight',

  addDrink: (catalogItemId: string) => {
    const entry: DrinkLogEntry = {
      id: crypto.randomUUID(),
      catalogItemId,
      loggedAt: new Date().toISOString(),
      userId: CURRENT_USER.id,
    };

    // Update local state synchronously
    set((state: DrinkStoreState) => ({ log: [...state.log, entry] }));

    // Persist to Supabase in background — find catalog item to get alcohol grams
    const catalog = get().catalog;
    const item = catalog.find((c) => c.id === catalogItemId);
    if (item) {
      const alcoholGrams = item.standardDrinks * 14;
      logDrink(CURRENT_USER.id, {
        catalogItemId: null, // mock IDs are not valid UUIDs in DB
        drinkType: item.category,
        alcoholGrams,
        abv: item.abv,
        volumeMl: item.volumeMl,
        vesselType: null,
        fillLevel: 1.0,
        isManualEntry: false,
      }).catch(() => {
        // Supabase unavailable (offline / tests) — local state already updated
      });
    }
  },

  removeDrink: (entryId: string) => {
    // Update local state synchronously
    set((state: DrinkStoreState) => ({
      log: state.log.filter((e: DrinkLogEntry) => e.id !== entryId),
    }));

    // Remove from Supabase in background
    removeDrinkFromDb(entryId).catch(() => {
      // Supabase unavailable — local state already updated
    });
  },

  setLeaderboardPeriod: (period: DrinkStoreState['leaderboardPeriod']) =>
    set(() => ({ leaderboardPeriod: period })),
}));

// Hydrate catalog from Supabase on first load, fall back to mock data
fetchDrinkCatalog()
  .then((rows) => {
    if (rows.length === 0) return;
    const items = rows
      .filter((r): r is typeof r & { category: DrinkCatalogItem['category'] } =>
        ['beer', 'cocktail', 'shot', 'wine', 'other'].includes(r.category),
      )
      .map(catalogRowToCatalogItem);
    if (items.length > 0) {
      useDrinkStore.setState({ catalog: items });
    }
  })
  .catch(() => {
    // Supabase unavailable — keep mock catalog
  });
