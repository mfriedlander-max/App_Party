import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePartyStore } from '@/store/party-store';
import type { PartyStoreState } from '@/types';

// Mock the party repository to avoid real Supabase calls
vi.mock('@/lib/repositories/party-repository', () => ({
  createParty: vi.fn().mockResolvedValue({
    id: 'server-party-id',
    name: 'Test Party',
    hostId: 'user-1',
    inviteCode: 'SERVER123',
    locationName: 'Test Location',
    startTime: new Date().toISOString(),
    status: 'active',
    members: [],
  }),
  joinParty: vi.fn().mockImplementation((_userId: string, inviteCode: string) =>
    Promise.resolve({
      id: 'joined-party-id',
      name: 'Joined Party',
      hostId: 'other-user',
      inviteCode,
      locationName: 'Somewhere',
      startTime: new Date().toISOString(),
      status: 'active',
      members: [],
    }),
  ),
  leaveParty: vi.fn().mockResolvedValue(undefined),
  endParty: vi.fn().mockResolvedValue(undefined),
  markDone: vi.fn().mockResolvedValue(undefined),
  fetchPartyMembers: vi.fn().mockResolvedValue([]),
  fetchActiveParty: vi.fn().mockResolvedValue(null),
  fetchPastParties: vi.fn().mockResolvedValue([]),
}));

// Mock supabase to avoid channel subscription errors
vi.mock('@/lib/supabase', () => ({
  supabase: null,
  getSupabaseClient: vi.fn(),
}));

beforeEach(() => {
  usePartyStore.setState((state: PartyStoreState) => ({
    ...state,
    activeParty: null,
    pastParties: [],
    partyMembers: [],
  }));
});

describe('usePartyStore — createParty', () => {
  it('creates a party optimistically with an invite code', async () => {
    await usePartyStore.getState().createParty('My Party', 'Downtown', []);
    const party = usePartyStore.getState().activeParty;
    expect(party).not.toBeNull();
    expect(party?.name).toBe('My Party');
    expect(typeof party?.inviteCode).toBe('string');
    expect(party?.inviteCode.length).toBeGreaterThan(0);
  });

  it('sets the party status to active', async () => {
    await usePartyStore.getState().createParty('Weekend Bash', 'Rooftop', []);
    expect(usePartyStore.getState().activeParty?.status).toBe('active');
  });

  it('archives previous active party when creating a new one', async () => {
    await usePartyStore.getState().createParty('First Party', 'Venue A', []);
    await usePartyStore.getState().createParty('Second Party', 'Venue B', []);
    expect(usePartyStore.getState().pastParties.length).toBeGreaterThanOrEqual(1);
  });
});

describe('usePartyStore — joinParty', () => {
  it('sets the joined party as active', async () => {
    await usePartyStore.getState().joinParty('INVITE42');
    const party = usePartyStore.getState().activeParty;
    expect(party).not.toBeNull();
    expect(party?.inviteCode).toBe('INVITE42');
  });
});

describe('usePartyStore — leaveParty', () => {
  it('removes the active party and moves it to pastParties', async () => {
    await usePartyStore.getState().createParty('Leave Test', 'Park', []);
    expect(usePartyStore.getState().activeParty).not.toBeNull();

    await usePartyStore.getState().leaveParty();
    expect(usePartyStore.getState().activeParty).toBeNull();
    expect(usePartyStore.getState().pastParties.length).toBeGreaterThanOrEqual(1);
  });

  it('does nothing if there is no active party', async () => {
    await usePartyStore.getState().leaveParty();
    expect(usePartyStore.getState().activeParty).toBeNull();
    expect(usePartyStore.getState().pastParties).toHaveLength(0);
  });
});
