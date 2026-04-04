export interface Party {
  id: string;
  name: string;
  hostId: string;
  memberIds: string[];
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
