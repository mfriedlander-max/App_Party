import type { User } from './user';
import type { DrinkCatalogItem, DrinkLogEntry } from './drink';
import type { LeaderboardEntry } from './leaderboard';
import type { SafetyAlert } from './safety';
import type { Party } from './party';
import type { SocialPost } from './social';
import type { Recap } from './recap';

export interface Toast {
  id: string;
  message: string;
  variant: 'success' | 'warning' | 'error' | 'info';
}

export interface AppStoreState {
  currentUser: User;
  notifications: SafetyAlert[];
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  addSafetyAlert: (alert: Omit<SafetyAlert, 'id' | 'triggeredAt'>) => void;
  acknowledgeSafetyAlert: (id: string) => void;
  awardXP: (amount: number) => void;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'avatarUrl' | 'weightKg' | 'biologicalSex' | 'heightCm'>>) => void;
}

export interface DrinkStoreState {
  catalog: DrinkCatalogItem[];
  log: DrinkLogEntry[];
  leaderboard: LeaderboardEntry[];
  leaderboardPeriod: 'tonight' | 'weekend' | 'alltime';
  addDrink: (catalogItemId: string) => void;
  removeDrink: (entryId: string) => void;
  setLeaderboardPeriod: (period: DrinkStoreState['leaderboardPeriod']) => void;
}

export interface PartyStoreState {
  activeParty: Party | null;
  pastParties: Party[];
  socialFeed: SocialPost[];
  recaps: Recap[];
  createParty: (name: string, location: string, memberIds: string[]) => void;
  joinParty: (inviteCode: string) => void;
  leaveParty: () => void;
}
