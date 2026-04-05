import { create } from 'zustand';
import type { PartyStoreState, Party, PartyMember } from '@/types';
import { ACTIVE_PARTY, PAST_PARTIES } from '@/data/mock-parties';
import { MOCK_SOCIAL_FEED } from '@/data/mock-social';
import { MOCK_RECAPS } from '@/data/mock-recaps';
import { generateInviteCode } from '@/utils/invite-code';
import { CURRENT_USER } from '@/data/mock-users';
import { supabase } from '@/lib/supabase';
import * as partyRepo from '@/lib/repositories/party-repository';

// ─── Mock-data seed (memberIds → PartyMember array) ─────────────────────────

function memberIdsToMembers(memberIds: string[], hostId: string): PartyMember[] {
  return memberIds.map((uid) => ({
    userId: uid,
    role: uid === hostId ? ('host' as const) : ('member' as const),
    joinedAt: new Date().toISOString(),
    done: false,
  }));
}

// Seed mock parties with PartyMember arrays so consumers don't need memberIds
const seedActiveParty: Party | null = ACTIVE_PARTY
  ? {
      ...ACTIVE_PARTY,
      members: memberIdsToMembers(ACTIVE_PARTY.memberIds ?? [], ACTIVE_PARTY.hostId),
    }
  : null;

const seedPastParties: Party[] = PAST_PARTIES.map((p) => ({
  ...p,
  members: memberIdsToMembers(p.memberIds ?? [], p.hostId),
}));

// ─── Store ───────────────────────────────────────────────────────────────────

export const usePartyStore = create<PartyStoreState>()((set, get) => ({
  activeParty: seedActiveParty,
  pastParties: seedPastParties,
  partyMembers: [],
  socialFeed: MOCK_SOCIAL_FEED,
  recaps: MOCK_RECAPS,
  loading: false,

  createParty: async (name: string, location: string, memberIds: string[]) => {
    // Optimistic local update using mock user id
    const optimistic: Party = {
      id: crypto.randomUUID(),
      name,
      hostId: CURRENT_USER.id,
      memberIds: [CURRENT_USER.id, ...memberIds],
      inviteCode: generateInviteCode(),
      locationName: location,
      startTime: new Date().toISOString(),
      status: 'active',
      members: memberIdsToMembers([CURRENT_USER.id, ...memberIds], CURRENT_USER.id),
    };

    set((state) => {
      const prev = state.activeParty;
      return {
        activeParty: optimistic,
        pastParties: prev
          ? [...state.pastParties, { ...prev, status: 'ended' as const }]
          : state.pastParties,
        partyMembers: optimistic.members ?? [],
      };
    });

    // Persist to Supabase in background
    try {
      const party = await partyRepo.createParty(CURRENT_USER.id, name, location, memberIds);
      set({ activeParty: { ...optimistic, id: party.id, inviteCode: party.inviteCode } });
    } catch {
      // Supabase unavailable — local optimistic state stands
    }
  },

  joinParty: async (inviteCode: string) => {
    try {
      const party = await partyRepo.joinParty(CURRENT_USER.id, inviteCode);
      set((state) => ({
        activeParty: party,
        pastParties: state.pastParties.filter((p) => p.id !== party.id),
        partyMembers: [],
      }));
    } catch {
      // Fallback: look in local mock data
      set((state) => {
        const found = state.pastParties.find((p) => p.inviteCode === inviteCode);
        if (!found) return state;
        return {
          activeParty: { ...found, status: 'active' as const },
          pastParties: state.pastParties.filter((p) => p.inviteCode !== inviteCode),
        };
      });
    }
  },

  leaveParty: async () => {
    const { activeParty } = get();
    if (!activeParty) return;

    set((state) => ({
      activeParty: null,
      pastParties: state.activeParty
        ? [...state.pastParties, { ...state.activeParty, status: 'ended' as const }]
        : state.pastParties,
      partyMembers: [],
    }));

    try {
      await partyRepo.leaveParty(CURRENT_USER.id, activeParty.id);
    } catch {
      // Supabase unavailable — local state already updated
    }
  },

  endParty: async () => {
    const { activeParty } = get();
    if (!activeParty) return;

    set((state) => ({
      activeParty: null,
      pastParties: state.activeParty
        ? [...state.pastParties, { ...state.activeParty, status: 'ended' as const }]
        : state.pastParties,
      partyMembers: [],
    }));

    try {
      await partyRepo.endParty(activeParty.id);
    } catch {
      // Supabase unavailable — local state already updated
    }
  },

  markDone: async () => {
    const { activeParty } = get();
    if (!activeParty) return;

    set((state) => ({
      partyMembers: state.partyMembers.map((m) =>
        m.userId === CURRENT_USER.id ? { ...m, done: true } : m,
      ),
    }));

    try {
      await partyRepo.markDone(CURRENT_USER.id, activeParty.id);
    } catch {
      // Supabase unavailable — local state already updated
    }
  },

  fetchPartyMembers: async (partyId: string) => {
    try {
      const members = await partyRepo.fetchPartyMembers(partyId);
      set({ partyMembers: members });
    } catch {
      // Supabase unavailable — keep existing members
    }
  },

  initParties: async (userId: string) => {
    set({ loading: true });
    try {
      const [active, past] = await Promise.all([
        partyRepo.fetchActiveParty(userId),
        partyRepo.fetchPastParties(userId),
      ]);
      set({
        activeParty: active,
        pastParties: past,
        loading: false,
      });

      // Subscribe to realtime updates for party_members if there's an active party
      if (active && supabase) {
        supabase
          .channel(`party_members:${active.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'party_members',
              filter: `party_id=eq.${active.id}`,
            },
            () => {
              // Re-fetch members on any change
              get().fetchPartyMembers(active.id).catch(() => {});
            },
          )
          .subscribe();
      }
    } catch {
      // Supabase unavailable — keep mock seed data
      set({ loading: false });
    }
  },
}));
