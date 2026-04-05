import { create } from 'zustand';
import type { FriendsStoreState } from '@/types';
import * as friendshipRepo from '@/lib/repositories/friendship-repository';
import { CURRENT_USER } from '@/data/mock-users';

export const useFriendsStore = create<FriendsStoreState>()((set) => ({
  friends: [],
  pendingRequests: [],
  searchResults: [],
  loading: false,

  sendRequest: async (addresseeId: string) => {
    const userId = CURRENT_USER.id;
    await friendshipRepo.sendFriendRequest(userId, addresseeId);
  },

  acceptRequest: async (requesterId: string) => {
    const userId = CURRENT_USER.id;
    await friendshipRepo.acceptFriendRequest(requesterId, userId);

    // Move from pending to friends locally
    set((state) => {
      const accepted = state.pendingRequests.find((r) => r.requesterId === requesterId);
      const newFriend = accepted
        ? {
            userId: requesterId,
            name: accepted.name,
            avatarSeed: accepted.avatarSeed,
            xp: 0,
            level: 1,
          }
        : null;
      return {
        pendingRequests: state.pendingRequests.filter((r) => r.requesterId !== requesterId),
        friends: newFriend ? [...state.friends, newFriend] : state.friends,
      };
    });
  },

  removeFriend: async (friendId: string) => {
    const userId = CURRENT_USER.id;
    await friendshipRepo.removeFriend(userId, friendId);
    set((state) => ({
      friends: state.friends.filter((f) => f.userId !== friendId),
    }));
  },

  searchUsers: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    const results = await friendshipRepo.searchUsers(query);
    // Exclude current user from results
    set({ searchResults: results.filter((u) => u.userId !== CURRENT_USER.id) });
  },

  init: async (userId: string) => {
    set({ loading: true });
    try {
      const [friends, pending] = await Promise.all([
        friendshipRepo.fetchFriends(userId),
        friendshipRepo.fetchPendingRequests(userId),
      ]);
      set({ friends, pendingRequests: pending, loading: false });
    } catch {
      // Supabase unavailable — leave empty lists
      set({ loading: false });
    }
  },
}));

// Hydrate on load if auth is available
const userId = CURRENT_USER.id;
if (userId) {
  useFriendsStore.getState().init(userId).catch(() => {});
}
