import { motion } from 'framer-motion';
import { Avatar } from '@/design-system/components/Avatar';
import { Badge } from '@/design-system/components/Badge';
import { staggerItem, springs } from '@/design-system/animations';
import type { LeaderboardEntry } from '@/types';
import { MOCK_USERS } from '@/data/mock-users';

interface LeaderboardRowProps {
  readonly entry: LeaderboardEntry;
  readonly isCurrentUser: boolean;
  readonly onTap: (entry: LeaderboardEntry) => void;
}

export function LeaderboardRow({ entry, isCurrentUser, onTap }: LeaderboardRowProps) {
  const user = MOCK_USERS.find((u) => u.id === entry.userId);
  if (!user) return null;

  return (
    <motion.div
      variants={staggerItem}
      data-testid={`leaderboard-rank-${entry.rank}`}
      data-current-user={String(isCurrentUser)}
      onClick={() => onTap(entry)}
      whileTap={{ scale: 0.97 }}
      transition={springs.snappy}
      className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer"
      style={
        isCurrentUser
          ? {
              background: 'rgba(0,229,255,0.06)',
              border: '1.5px solid rgba(0,229,255,0.3)',
              boxShadow: '0 0 16px rgba(0,229,255,0.08)',
            }
          : {
              background: 'var(--theme-surface-raised)',
              border: '1px solid var(--theme-border-subtle)',
            }
      }
    >
      {/* Rank number */}
      <span
        className="text-2xl font-black w-9 text-center flex-shrink-0"
        style={{ color: isCurrentUser ? '#00E5FF' : '#5A5A70' }}
      >
        {entry.rank}
      </span>

      {/* Avatar */}
      <Avatar seed={user.name} size="md" />

      {/* Name + drink count */}
      <div className="flex-1 min-w-0">
        <p className="text-text-primary font-semibold text-base truncate">{user.name}</p>
        <p className="text-text-secondary text-base">
          {entry.drinkCount} {entry.drinkCount === 1 ? 'drink' : 'drinks'}
        </p>
      </div>

      {/* XP badge */}
      <Badge type="label" label={`${entry.xp} XP`} variant="muted" />
    </motion.div>
  );
}
