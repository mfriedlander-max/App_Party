import type { User } from './user';
import type { DrinkCatalogItem, DrinkLogEntry } from './drink';
import type { LeaderboardEntry } from './leaderboard';
import type { SafetyAlert } from './safety';
import type { Badge } from './engagement';
import type { Party, PartyMember } from './party';
import type { SocialPost } from './social';
import type { Recap } from './recap';
import type { FriendProfile, FriendRequest } from '@/lib/repositories/friendship-repository';

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
  /** Fetches user achievements from Supabase and merges into currentUser.badges */
  initAchievements: (userId: string) => Promise<void>;
  /** Persists streak update to Supabase */
  persistStreak: (userId: string, streakWeekends: number, lastActiveWeekend: string) => Promise<void>;
  /** Check for newly unlocked achievements after significant events */
  checkAchievements: (context: { drinkCount: number; friendCount: number; streak: number; drinkTypes: string[]; lastDrinkHour?: number; soberNight?: boolean }) => Promise<Badge[]>;
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
  partyMembers: PartyMember[];
  socialFeed: SocialPost[];
  recaps: Recap[];
  loading: boolean;
  createParty: (name: string, location: string, memberIds: string[]) => Promise<void>;
  joinParty: (inviteCode: string) => Promise<void>;
  leaveParty: () => Promise<void>;
  endParty: () => Promise<void>;
  markDone: () => Promise<void>;
  fetchPartyMembers: (partyId: string) => Promise<void>;
  initParties: (userId: string) => Promise<void>;
}

export interface FriendsStoreState {
  friends: FriendProfile[];
  pendingRequests: FriendRequest[];
  searchResults: FriendProfile[];
  loading: boolean;
  sendRequest: (addresseeId: string) => Promise<void>;
  acceptRequest: (requesterId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<void>;
  init: (userId: string) => Promise<void>;
}
