import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { SheetModal } from '@/design-system/components/SheetModal';
import { Avatar } from '@/design-system/components/Avatar';
import type { LeaderboardEntry } from '@/types';
import { MOCK_USERS, CURRENT_USER } from '@/data/mock-users';

interface FriendComparisonProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly friendEntry: LeaderboardEntry | null;
  readonly currentEntry: LeaderboardEntry | null;
}

interface StatBarProps {
  readonly label: string;
  readonly yourValue: number;
  readonly friendValue: number;
  readonly max: number;
  readonly format?: (v: number) => string;
}

function StatBar({ label, yourValue, friendValue, max, format }: StatBarProps) {
  const fmt = format ?? String;
  const yourPct = max > 0 ? Math.min(100, (yourValue / max) * 100) : 0;
  const friendPct = max > 0 ? Math.min(100, (friendValue / max) * 100) : 0;

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex justify-between items-center">
        <span className="text-text-secondary text-sm font-medium">{label}</span>
      </div>
      {/* You bar */}
      <div className="flex items-center gap-3">
        <span className="text-text-primary text-sm w-8 text-right">{fmt(yourValue)}</span>
        <div className="flex-1 h-3 bg-border-subtle rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[#FF2D55]"
            initial={{ width: 0 }}
            animate={{ width: `${yourPct}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.1 }}
          />
        </div>
        <span className="text-text-secondary text-xs w-6">You</span>
      </div>
      {/* Friend bar */}
      <div className="flex items-center gap-3">
        <span className="text-text-primary text-sm w-8 text-right">{fmt(friendValue)}</span>
        <div className="flex-1 h-3 bg-border-subtle rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[#00E5FF]"
            initial={{ width: 0 }}
            animate={{ width: `${friendPct}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.2 }}
          />
        </div>
        <span className="text-text-secondary text-xs w-6">Them</span>
      </div>
    </div>
  );
}

export function FriendComparison({
  isOpen,
  onClose,
  friendEntry,
  currentEntry,
}: FriendComparisonProps) {
  const friend = friendEntry ? MOCK_USERS.find((u) => u.id === friendEntry.userId) : null;

  if (!friend || !friendEntry || !currentEntry) return null;

  const maxDrinks = Math.max(currentEntry.drinkCount, friendEntry.drinkCount, 1);
  const maxXp = Math.max(currentEntry.xp, friendEntry.xp, 1);

  return (
    <SheetModal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary">
            You vs. {friend.name.split(' ')[0]}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-border-subtle cursor-pointer"
            aria-label="Close"
          >
            <X size={18} className="text-text-secondary" />
          </button>
        </div>

        {/* Avatars */}
        <div className="flex items-center justify-center gap-8 py-4">
          <div className="flex flex-col items-center gap-2">
            <Avatar seed={CURRENT_USER.name} size="lg" />
            <span className="text-text-primary text-sm font-semibold">
              {CURRENT_USER.name.split(' ')[0]}
            </span>
          </div>
          <span className="text-accent text-2xl font-black">VS</span>
          <div className="flex flex-col items-center gap-2">
            <Avatar seed={friend.name} size="lg" />
            <span className="text-text-primary text-sm font-semibold">
              {friend.name.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* Stat bars */}
        <div className="flex flex-col">
          <StatBar
            label="Drinks"
            yourValue={currentEntry.drinkCount}
            friendValue={friendEntry.drinkCount}
            max={maxDrinks}
          />
          <StatBar
            label="XP"
            yourValue={currentEntry.xp}
            friendValue={friendEntry.xp}
            max={maxXp}
          />
          <StatBar
            label="Rank"
            yourValue={Math.max(0, 10 - currentEntry.rank)}
            friendValue={Math.max(0, 10 - friendEntry.rank)}
            max={10}
            format={() => `#${currentEntry.rank}`}
          />
        </div>
      </div>
    </SheetModal>
  );
}
