import { create } from 'zustand';
import type { PartyStoreState, Party } from '@/types';
import { ACTIVE_PARTY, PAST_PARTIES } from '@/data/mock-parties';
import { MOCK_SOCIAL_FEED } from '@/data/mock-social';
import { MOCK_RECAPS } from '@/data/mock-recaps';
import { generateInviteCode } from '@/utils/invite-code';
import { CURRENT_USER } from '@/data/mock-users';

export const usePartyStore = create<PartyStoreState>()((set) => ({
  activeParty: ACTIVE_PARTY,
  pastParties: PAST_PARTIES,
  socialFeed: MOCK_SOCIAL_FEED,
  recaps: MOCK_RECAPS,

  createParty: (name: string, location: string, memberIds: string[]) =>
    set((state: PartyStoreState) => {
      const newParty: Party = {
        id: crypto.randomUUID(),
        name,
        hostId: CURRENT_USER.id,
        memberIds: [CURRENT_USER.id, ...memberIds],
        inviteCode: generateInviteCode(),
        locationName: location,
        startTime: new Date().toISOString(),
        status: 'active',
      };
      const prevActive = state.activeParty;
      return {
        activeParty: newParty,
        pastParties: prevActive
          ? [...state.pastParties, { ...prevActive, status: 'ended' as const }]
          : state.pastParties,
      };
    }),

  joinParty: (inviteCode: string) =>
    set((state: PartyStoreState) => {
      const found = state.pastParties.find((p: Party) => p.inviteCode === inviteCode);
      if (!found) return state;
      return {
        activeParty: { ...found, status: 'active' as const },
        pastParties: state.pastParties.filter((p: Party) => p.inviteCode !== inviteCode),
      };
    }),

  leaveParty: () =>
    set((state: PartyStoreState) => ({
      activeParty: null,
      pastParties: state.activeParty
        ? [...state.pastParties, { ...state.activeParty, status: 'ended' as const }]
        : state.pastParties,
    })),
}));
