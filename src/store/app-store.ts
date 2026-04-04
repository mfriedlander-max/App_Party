import { create } from 'zustand';
import type { AppStoreState, Toast } from '@/types';
import type { SafetyAlert } from '@/types';
import { CURRENT_USER } from '@/data/mock-users';

export const useAppStore = create<AppStoreState>()((set) => ({
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

  awardXP: (amount: number) =>
    set((state: AppStoreState) => ({
      currentUser: { ...state.currentUser, xp: state.currentUser.xp + amount },
    })),

  updateProfile: (updates) =>
    set((state: AppStoreState) => ({
      currentUser: { ...state.currentUser, ...updates },
    })),
}));
