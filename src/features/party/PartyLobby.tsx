import { useState, useEffect } from 'react';
import { MapPin, LogOut, UserPlus } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { PartyMember } from './PartyMember';
import { InviteCode } from './InviteCode';
import { usePartyStore } from '@/store/party-store';
import { MOCK_USERS } from '@/data/mock-users';
import type { Party } from '@/types';

interface PartyLobbyProps {
  readonly party: Party;
}

function useElapsed(startTime: string): string {
  const [elapsed, setElapsed] = useState(() => getElapsedLabel(startTime));

  useEffect(() => {
    const id = setInterval(() => setElapsed(getElapsedLabel(startTime)), 30_000);
    return () => clearInterval(id);
  }, [startTime]);

  return elapsed;
}

function getElapsedLabel(startTime: string): string {
  const diff = Date.now() - new Date(startTime).getTime();
  const totalMins = Math.floor(diff / 60_000);
  if (totalMins < 60) return `${totalMins}m going`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m > 0 ? `${h}h ${m}m going` : `${h}h going`;
}

export function PartyLobby({ party }: PartyLobbyProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const leaveParty = usePartyStore((s) => s.leaveParty);
  const elapsed = useElapsed(party.startTime);

  const members = MOCK_USERS.filter((u) => party.memberIds.includes(u.id));

  const membersWithDrinks = members.map((user, i) => ({
    user,
    drinkCount: Math.max(0, 5 - i),
  })).sort((a, b) => b.drinkCount - a.drinkCount);

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-6">
      {/* Party header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-text-primary text-2xl font-black">{party.name}</h1>
        <div className="flex items-center gap-1 text-text-secondary text-base">
          <MapPin size={14} />
          <span>{party.locationName}</span>
        </div>
        <p className="text-[#00E5FF] text-base font-semibold mt-1">{elapsed}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => setInviteOpen(true)} fullWidth>
          <UserPlus size={18} className="mr-2" />
          Invite Friends
        </Button>
      </div>

      {/* Member grid */}
      <div>
        <h2 className="text-text-primary font-bold text-lg mb-3">
          Members · {members.length}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {membersWithDrinks.map(({ user, drinkCount }) => (
            <PartyMember key={user.id} user={user} drinkCount={drinkCount} bac={0} />
          ))}
        </div>
      </div>

      {/* Mini leaderboard */}
      <div>
        <h2 className="text-text-primary font-bold text-lg mb-3">Party Leaderboard</h2>
        <div className="flex flex-col gap-2">
          {membersWithDrinks.map(({ user, drinkCount }, i) => (
            <div
              key={user.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-raised border border-border-subtle"
            >
              <span className="text-text-muted font-black text-lg w-6">{i + 1}</span>
              <span className="text-text-primary font-semibold flex-1">{user.name.split(' ')[0]}</span>
              <span className="text-text-secondary text-base">{drinkCount} drinks</span>
            </div>
          ))}
        </div>
      </div>

      {/* Leave button */}
      <Button variant="ghost" onClick={leaveParty} fullWidth>
        <LogOut size={18} className="mr-2" />
        Leave Party
      </Button>

      <InviteCode
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        code={party.inviteCode}
      />
    </div>
  );
}
