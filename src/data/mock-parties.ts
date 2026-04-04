import type { Party } from '@/types';
import { MOCK_USERS } from './mock-users';

const now = Date.now();
const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

export const MOCK_PARTIES: Party[] = [
  {
    id: 'party-1',
    name: 'Friday Night Rooftop',
    hostId: MOCK_USERS[2].id,
    memberIds: [MOCK_USERS[0].id, MOCK_USERS[1].id, MOCK_USERS[2].id, MOCK_USERS[4].id, MOCK_USERS[5].id],
    inviteCode: 'RTF42X',
    locationName: 'The Rooftop Bar, Downtown',
    startTime: new Date(now - 2 * ONE_HOUR).toISOString(),
    status: 'active',
  },
  {
    id: 'party-2',
    name: 'Last Weekend Kickback',
    hostId: MOCK_USERS[0].id,
    memberIds: [MOCK_USERS[0].id, MOCK_USERS[3].id, MOCK_USERS[6].id, MOCK_USERS[7].id],
    inviteCode: 'KB8WPQ',
    locationName: "Jordan's Place",
    startTime: new Date(now - 7 * ONE_DAY).toISOString(),
    status: 'ended',
  },
  {
    id: 'party-3',
    name: 'Saturday Beach Bonfire',
    hostId: MOCK_USERS[7].id,
    memberIds: [MOCK_USERS[0].id, MOCK_USERS[1].id, MOCK_USERS[5].id, MOCK_USERS[7].id],
    inviteCode: 'BNF99Z',
    locationName: 'Sunset Beach, Point Dume',
    startTime: new Date(now + 2 * ONE_DAY).toISOString(),
    status: 'upcoming',
  },
];

export const ACTIVE_PARTY = MOCK_PARTIES[0];
export const PAST_PARTIES = MOCK_PARTIES.filter((p) => p.status === 'ended');
