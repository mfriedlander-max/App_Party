import { useState, useEffect } from 'react';
import { MapPin, LogOut, UserPlus, CheckCircle } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { PartyMember } from './PartyMember';
import { InviteCode } from './InviteCode';
import { CaptureButton } from '@/features/social/CaptureButton';
import { usePartyStore } from '@/store/party-store';
import { useAppStore } from '@/store/app-store';
import { useLocationTracker } from '@/hooks/use-location-tracker';
import { MOCK_USERS } from '@/data/mock-users';
import { CURRENT_USER } from '@/data/mock-users';
import type { Party, PartyMember as PartyMemberType } from '@/types';
import type { User } from '@/types';

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

interface MemberDisplay {
  user: User;
  drinkCount: number;
  done: boolean;
}

export function PartyLobby({ party }: PartyLobbyProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const leaveParty = usePartyStore((s) => s.leaveParty);
  const markDone = usePartyStore((s) => s.markDone);
  const partyMembersFromStore = usePartyStore((s) => s.partyMembers);
  const fetchPartyMembers = usePartyStore((s) => s.fetchPartyMembers);
  const addToast = useAppStore((s) => s.addToast);
  const elapsed = useElapsed(party.startTime);

  // Track location while in active party — fire-and-forget, graceful on denial
  useLocationTracker({
    userId: CURRENT_USER.id,
    partyId: party.id,
    active: true,
  });

  useEffect(() => {
    fetchPartyMembers(party.id).catch(() => {});
  }, [party.id, fetchPartyMembers]);

  // Resolve member display data from store members (Supabase) or party.members (local)
  const resolvedMembers: MemberDisplay[] = (() => {
    // Prefer live Supabase members if available
    const liveMembers: PartyMemberType[] =
      partyMembersFromStore.length > 0
        ? partyMembersFromStore
        : (party.members ?? []);

    if (liveMembers.length > 0) {
      return liveMembers.map((pm, i) => {
        // Try to find a matching mock user by userId
        const mockUser = MOCK_USERS.find((u) => u.id === pm.userId);
        const user: User = mockUser ?? {
          id: pm.userId,
          name: pm.name ?? `Member ${i + 1}`,
          avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${pm.avatarSeed ?? pm.userId}`,
          xp: 0,
          level: 1,
          streakWeekends: 0,
          badges: [],
          weightKg: 70,
          heightCm: 175,
          biologicalSex: 'male',
        };
        return { user, drinkCount: Math.max(0, 5 - i), done: pm.done };
      });
    }

    // Fallback to memberIds (mock data only)
    const memberIds = party.memberIds ?? [];
    return MOCK_USERS.filter((u) => memberIds.includes(u.id)).map((user, i) => ({
      user,
      drinkCount: Math.max(0, 5 - i),
      done: false,
    }));
  })();

  const sorted = [...resolvedMembers].sort((a, b) => b.drinkCount - a.drinkCount);

  const currentUserMember = resolvedMembers.find((m) => m.user.id === CURRENT_USER.id);
  const alreadyDone = currentUserMember?.done ?? false;

  async function handleMarkDone() {
    try {
      await markDone();
      addToast({ message: 'Marked as done for the night!', variant: 'success' });

      // Check if everyone is now done
      const updatedMembers = resolvedMembers.map((m) =>
        m.user.id === CURRENT_USER.id ? { ...m, done: true } : m,
      );
      const allDone = updatedMembers.length > 0 && updatedMembers.every((m) => m.done);
      if (allDone) {
        addToast({ message: "Party's over! Your recap will be ready soon.", variant: 'success' });
      }
    } catch {
      addToast({ message: 'Could not mark done — try again', variant: 'error' });
    }
  }

  async function handleLeave() {
    try {
      await leaveParty();
    } catch {
      addToast({ message: 'Could not leave party — try again', variant: 'error' });
    }
  }

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
        {!alreadyDone && (
          <Button variant="ghost" onClick={handleMarkDone} fullWidth>
            <CheckCircle size={18} className="mr-2" />
            I'm Done
          </Button>
        )}
        {alreadyDone && (
          <div className="flex items-center gap-2 px-4 text-[#30D158] text-base font-semibold">
            <CheckCircle size={18} />
            Done for tonight
          </div>
        )}
      </div>

      {/* Member grid */}
      <div>
        <h2 className="text-text-primary font-bold text-lg mb-3">
          Members · {resolvedMembers.length}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {sorted.map(({ user, drinkCount, done }) => (
            <PartyMember key={user.id} user={user} drinkCount={drinkCount} bac={0} done={done} />
          ))}
        </div>
      </div>

      {/* Mini leaderboard */}
      <div>
        <h2 className="text-text-primary font-bold text-lg mb-3">Party Leaderboard</h2>
        <div className="flex flex-col gap-2">
          {sorted.map(({ user, drinkCount, done }, i) => (
            <div
              key={user.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-raised border border-border-subtle"
            >
              <span className="text-text-muted font-black text-lg w-6">{i + 1}</span>
              <span className="text-text-primary font-semibold flex-1">{user.name.split(' ')[0]}</span>
              {done && <CheckCircle size={16} className="text-[#30D158]" />}
              <span className="text-text-secondary text-base">{drinkCount} drinks</span>
            </div>
          ))}
        </div>
      </div>

      {/* Leave button */}
      <Button variant="ghost" onClick={handleLeave} fullWidth>
        <LogOut size={18} className="mr-2" />
        Leave Party
      </Button>

      <InviteCode
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        code={party.inviteCode}
      />

      {/* Floating camera button — tag photos with this party */}
      <CaptureButton partyId={party.id} />
    </div>
  );
}
