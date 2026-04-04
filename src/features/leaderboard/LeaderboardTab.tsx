import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { EmptyState } from '@/design-system/components/EmptyState';
import { Avatar } from '@/design-system/components/Avatar';
import { LeaderboardFilters } from './LeaderboardFilters';
import { LeaderboardRow } from './LeaderboardRow';
import { FriendComparison } from './FriendComparison';
import { useDrinkStore } from '@/store/drink-store';
import { MOCK_USERS, CURRENT_USER } from '@/data/mock-users';
import { staggerContainer } from '@/design-system/animations';
import type { LeaderboardEntry } from '@/types';

const MEDAL_COLORS = {
  1: '#FFD60A',
  2: '#C0C0C0',
  3: '#CD7F32',
} as const;

const PODIUM_HEIGHTS = { 1: 'h-20', 2: 'h-14', 3: 'h-10' } as const;
const AVATAR_SIZES: Record<1 | 2 | 3, 'lg' | 'md'> = { 1: 'lg', 2: 'md', 3: 'md' };

function PodiumSpot({
  entry,
  position,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  position: 1 | 2 | 3;
  isCurrentUser: boolean;
}) {
  const user = MOCK_USERS.find((u) => u.id === entry.userId);
  if (!user) return null;

  const color = MEDAL_COLORS[position];

  return (
    <div
      data-testid={`leaderboard-rank-${entry.rank}`}
      data-current-user={String(isCurrentUser)}
      className="flex flex-col items-center gap-2 flex-1"
    >
      {/* Inner podium marker for podium-specific tests */}
      <span data-testid={`podium-${position}`} className="sr-only" />

      <div
        className="relative"
        style={isCurrentUser ? { filter: 'drop-shadow(0 0 12px rgba(0,229,255,0.5))' } : undefined}
      >
        <Avatar seed={user.name} size={AVATAR_SIZES[position]} />
      </div>

      <p className="text-text-primary text-sm font-semibold text-center truncate w-full px-1">
        {user.name.split(' ')[0]}
      </p>
      <p className="text-text-secondary text-sm">{entry.drinkCount} 🍺</p>

      {/* Podium block */}
      <div
        className={`w-full ${PODIUM_HEIGHTS[position]} rounded-t-xl flex items-start justify-center pt-2`}
        style={{ backgroundColor: color + '22', border: `1px solid ${color}44` }}
      >
        <span className="text-lg font-black" style={{ color }}>
          {position}
        </span>
      </div>
    </div>
  );
}

export function LeaderboardTab() {
  const leaderboard = useDrinkStore((s) => s.leaderboard);
  const [comparisonEntry, setComparisonEntry] = useState<LeaderboardEntry | null>(null);

  const sorted = [...leaderboard].sort((a, b) => a.rank - b.rank);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  const currentEntry = sorted.find((e) => e.userId === CURRENT_USER.id) ?? null;

  // Podium visual order: 2nd left, 1st center, 3rd right
  const podiumOrder: (LeaderboardEntry | undefined)[] = [top3[1], top3[0], top3[2]];

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-6 gap-4">
      <LeaderboardFilters />

      {leaderboard.length === 0 ? (
        <EmptyState
          icon={<Trophy size={56} />}
          title="No rankings yet"
          subtitle="Be the first to log a drink!"
          className="flex-1"
        />
      ) : (
        <>
          {/* Podium — top 3 */}
          {top3.length >= 1 && (
            <div className="flex items-end gap-2 px-2 pt-4">
              {podiumOrder.map((entry, idx) => {
                if (!entry) return <div key={`empty-${idx}`} className="flex-1" />;
                const position = (idx === 0 ? 2 : idx === 1 ? 1 : 3) as 1 | 2 | 3;
                return (
                  <PodiumSpot
                    key={entry.userId}
                    entry={entry}
                    position={position}
                    isCurrentUser={entry.userId === CURRENT_USER.id}
                  />
                );
              })}
            </div>
          )}

          {/* Ranked list (4th+) */}
          {rest.length > 0 && (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-2"
            >
              {rest.map((entry) => (
                <LeaderboardRow
                  key={entry.userId}
                  entry={entry}
                  isCurrentUser={entry.userId === CURRENT_USER.id}
                  onTap={setComparisonEntry}
                />
              ))}
            </motion.div>
          )}
        </>
      )}

      <FriendComparison
        isOpen={comparisonEntry !== null}
        onClose={() => setComparisonEntry(null)}
        friendEntry={comparisonEntry}
        currentEntry={currentEntry}
      />
    </div>
  );
}
