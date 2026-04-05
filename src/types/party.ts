export interface PartyMember {
  userId: string;
  role: 'host' | 'member';
  joinedAt: string;
  done: boolean;
  name?: string;
  avatarSeed?: string;
}

export interface Party {
  id: string;
  name: string;
  hostId: string;
  /** @deprecated Use members instead; kept for mock data backward compat */
  memberIds?: string[];
  members?: PartyMember[];
  inviteCode: string;
  locationName: string;
  startTime: string;
  status: 'upcoming' | 'active' | 'ended';
}

export interface Invite {
  code: string;
  partyId: string;
  expiresAt: string;
}
