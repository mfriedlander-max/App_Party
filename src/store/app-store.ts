import { create } from 'zustand';
import type { AppStoreState, Toast } from '@/types';
import type { SafetyAlert } from '@/types';
import type { Badge } from '@/types';
import { CURRENT_USER } from '@/data/mock-users';
import { updateProfile as updateProfileInDb, awardXP as awardXPInDb } from '@/lib/repositories/profile-repository';
import { fetchUserAchievements, updateStreak } from '@/lib/repositories/gamification-repository';
import { checkAndUnlockAchievements } from '@/lib/services/gamification-engine';

export const useAppStore = create<AppStoreState>()((set, get) => ({
  currentUser: CURRENT_USER,
  notifications: [],
  toasts: [],

  addToast: (toast: Omit<Toast, 'id'>) =>
    set((state: AppStoreState) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
    })),

  dismissToast: (id: string) =>
    set((state: AppStoreState) => ({
      toasts: state.toasts.filter((t: Toast) => t.id !== id),
    })),

  addSafetyAlert: (alert: Omit<SafetyAlert, 'id' | 'triggeredAt'>) =>
    set((state: AppStoreState) => ({
      notifications: [
        ...state.notifications,
        {
          ...alert,
          id: crypto.randomUUID(),
          triggeredAt: new Date().toISOString(),
        },
      ],
    })),

  acknowledgeSafetyAlert: (id: string) =>
    set((state: AppStoreState) => ({
      notifications: state.notifications.map((n: SafetyAlert) =>
        n.id === id ? { ...n, acknowledged: true } : n,
      ),
    })),

  awardXP: (amount: number) => {
    // Update local state synchronously
    set((state: AppStoreState) => ({
      currentUser: { ...state.currentUser, xp: state.currentUser.xp + amount },
    }));

    // Persist to Supabase in background
    const { currentUser } = get();
    awardXPInDb(currentUser.id, amount).catch(() => {
      // Supabase unavailable — local state already updated
    });
  },

  updateProfile: (updates) => {
    // Update local state synchronously
    set((state: AppStoreState) => ({
      currentUser: { ...state.currentUser, ...updates },
    }));

    // Persist to Supabase in background — map camelCase to snake_case
    const { currentUser } = get();
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.weightKg !== undefined) dbUpdates.weight_kg = updates.weightKg;
    if (updates.heightCm !== undefined) dbUpdates.height_cm = updates.heightCm;
    if (updates.biologicalSex !== undefined) dbUpdates.biological_sex = updates.biologicalSex;

    if (Object.keys(dbUpdates).length > 0) {
      updateProfileInDb(currentUser.id, dbUpdates).catch(() => {
        // Supabase unavailable — local state already updated
      });
    }
  },

  initAchievements: async (userId: string) => {
    try {
      const userAchievements = await fetchUserAchievements(userId);
      const badges: Badge[] = userAchievements.map((ua) => ({
        id: ua.achievement_id,
        name: ua.achievements.name,
        description: ua.achievements.description,
        emoji: ua.achievements.emoji,
        unlockedAt: ua.unlocked_at,
      }));
      set((state: AppStoreState) => ({
        currentUser: { ...state.currentUser, badges },
      }));
    } catch {
      // Supabase unavailable — keep existing badges
    }
  },

  persistStreak: async (userId: string, streakWeekends: number, lastActiveWeekend: string) => {
    set((state: AppStoreState) => ({
      currentUser: { ...state.currentUser, streakWeekends },
    }));
    try {
      await updateStreak(userId, streakWeekends, lastActiveWeekend);
    } catch {
      // Supabase unavailable — local state already updated
    }
  },

  checkAchievements: async (context) => {
    const { currentUser } = get();
    try {
      const unlocked = await checkAndUnlockAchievements(currentUser.id, context);
      if (unlocked.length > 0) {
        const newBadges: Badge[] = unlocked.map((u) => ({
          id: u.id,
          name: u.name,
          description: u.description,
          emoji: u.emoji,
          unlockedAt: new Date().toISOString(),
        }));
        set((state: AppStoreState) => ({
          currentUser: {
            ...state.currentUser,
            badges: [
              ...state.currentUser.badges.filter(
                (b) => !newBadges.some((nb) => nb.id === b.id),
              ),
              ...newBadges,
            ],
          },
        }));
      }
      return unlocked.map((u) => ({
        id: u.id,
        name: u.name,
        description: u.description,
        emoji: u.emoji,
        unlockedAt: new Date().toISOString(),
      }));
    } catch {
      // Achievement checking is non-critical
      return [];
    }
  },
}));
