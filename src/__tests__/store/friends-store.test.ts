import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFriendsStore } from '@/store/friends-store';
import type { FriendsStoreState } from '@/types';
import type { FriendRequest } from '@/lib/repositories/friendship-repository';

// Mock the friendship repository to avoid real Supabase calls
vi.mock('@/lib/repositories/friendship-repository', () => ({
  sendFriendRequest: vi.fn().mockResolvedValue(undefined),
  acceptFriendRequest: vi.fn().mockResolvedValue(undefined),
  removeFriend: vi.fn().mockResolvedValue(undefined),
  searchUsers: vi.fn().mockResolvedValue([]),
  fetchFriends: vi.fn().mockResolvedValue([]),
  fetchPendingRequests: vi.fn().mockResolvedValue([]),
}));

const pendingRequest: FriendRequest = {
  requesterId: 'requester-1',
  name: 'Alice',
  avatarSeed: 'alice',
  createdAt: new Date().toISOString(),
};

beforeEach(() => {
  useFriendsStore.setState((state: FriendsStoreState) => ({
    ...state,
    friends: [],
    pendingRequests: [],
    searchResults: [],
  }));
});

describe('useFriendsStore — sendRequest', () => {
  it('calls the repository without throwing', async () => {
    await expect(
      useFriendsStore.getState().sendRequest('user-999'),
    ).resolves.toBeUndefined();
  });
});

describe('useFriendsStore — acceptRequest', () => {
  it('moves the request from pending to friends list', async () => {
    // Seed a pending request
    useFriendsStore.setState((state: FriendsStoreState) => ({
      ...state,
      pendingRequests: [pendingRequest],
    }));

    await useFriendsStore.getState().acceptRequest('requester-1');

    const { friends, pendingRequests } = useFriendsStore.getState();
    expect(pendingRequests).toHaveLength(0);
    expect(friends).toHaveLength(1);
    expect(friends[0].userId).toBe('requester-1');
    expect(friends[0].name).toBe('Alice');
  });

  it('does not add duplicate if requester not in pending', async () => {
    await useFriendsStore.getState().acceptRequest('unknown-user');
    expect(useFriendsStore.getState().friends).toHaveLength(0);
  });
});

describe('useFriendsStore — removeFriend', () => {
  it('removes the correct friend by userId', async () => {
    useFriendsStore.setState((state: FriendsStoreState) => ({
      ...state,
      friends: [
        { userId: 'friend-1', name: 'Bob', avatarSeed: 'bob', xp: 100, level: 1 },
        { userId: 'friend-2', name: 'Carol', avatarSeed: 'carol', xp: 200, level: 2 },
      ],
    }));

    await useFriendsStore.getState().removeFriend('friend-1');

    const { friends } = useFriendsStore.getState();
    expect(friends).toHaveLength(1);
    expect(friends[0].userId).toBe('friend-2');
  });
});
