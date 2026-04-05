import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Settings } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { Avatar } from '@/design-system/components/Avatar';
import { ProgressBar } from '@/design-system/components/ProgressBar';
import { Card } from '@/design-system/components/Card';
import { StreakTracker } from './StreakTracker';
import { SettingsSheet } from '@/features/settings/SettingsSheet';
import { useAppStore } from '@/store/app-store';
import { useDrinkStore } from '@/store/drink-store';
import { usePartyStore } from '@/store/party-store';
import { ALL_BADGES } from '@/data/mock-achievements';
import { fetchAchievements } from '@/lib/repositories/gamification-repository';
import { levelThreshold, xpToLevel } from '@/utils/xp-calculator';
import { formatXP } from '@/utils/format';
import { staggerContainer, staggerItem } from '@/design-system/animations';
import type { Badge } from '@/types';
import type { AchievementRow } from '@/lib/repositories/gamification-repository';

interface BadgeGridProps {
  readonly earnedBadges: Badge[];
  readonly allAchievements: AchievementRow[];
}

function BadgeGrid({ earnedBadges, allAchievements }: BadgeGridProps) {
  const earnedIds = new Set(earnedBadges.map((b) => b.id));

  // Use real achievements from Supabase if available, fall back to mock data
  const displayBadges: Array<{ id: string; name: string; description: string; emoji: string }> =
    allAchievements.length > 0
      ? allAchievements
      : ALL_BADGES;

  return (
    <div className="grid grid-cols-4 gap-3">
      {displayBadges.map((badge) => {
        const isEarned = earnedIds.has(badge.id);
        return (
          <motion.div
            key={badge.id}
            variants={staggerItem}
            title={`${badge.name}: ${badge.description}`}
            className="flex flex-col items-center gap-1"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all"
              style={{
                background: isEarned
                  ? 'rgba(255,45,85,0.15)'
                  : 'var(--theme-surface-elevated)',
                border: isEarned
                  ? '1.5px solid rgba(255,45,85,0.4)'
                  : '1.5px solid var(--theme-border)',
                opacity: isEarned ? 1 : 0.35,
                filter: isEarned ? 'none' : 'grayscale(1)',
              }}
            >
              {badge.emoji}
            </div>
            <span
              className="text-xs font-semibold text-center leading-tight line-clamp-1"
              style={{ color: isEarned ? '#F0F0F5' : '#5A5A70' }}
            >
              {badge.name}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

export function ProfileStats() {
  const currentUser = useAppStore((s) => s.currentUser);
  const drinkLog = useDrinkStore((s) => s.log);
  const pastParties = usePartyStore((s) => s.pastParties);
  const { theme, toggleTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [allAchievements, setAllAchievements] = useState<AchievementRow[]>([]);

  useEffect(() => {
    fetchAchievements()
      .then(setAllAchievements)
      .catch(() => {
        // Supabase unavailable — fall back to mock badge list
      });
  }, []);

  const level = xpToLevel(currentUser.xp);
  const currentThreshold = levelThreshold(level);
  const nextThreshold = levelThreshold(level + 1);
  const progressInLevel = currentUser.xp - currentThreshold;
  const levelRange = nextThreshold - currentThreshold;

  const seed = currentUser.name.split(' ')[0];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="p-4 space-y-5"
    >
      {/* Header row */}
      <div className="flex items-start justify-between">
        <motion.div variants={staggerItem} className="flex items-center gap-4">
          <Avatar seed={seed} size="lg" />
          <div className="flex flex-col gap-0.5">
            <h2 className="text-2xl font-black text-text-primary leading-tight">
              {currentUser.name}
            </h2>
            <span
              className="text-sm font-bold px-2.5 py-0.5 rounded-full w-fit"
              style={{ background: 'rgba(255,45,85,0.2)', color: '#FF2D55' }}
            >
              Level {level}
            </span>
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSettingsOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full"
            style={{ background: 'var(--theme-surface-elevated)' }}
            aria-label="Open settings"
          >
            <Settings size={18} color="#9090A0" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-full"
            style={{ background: 'var(--theme-surface-elevated)' }}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark'
              ? <Sun size={18} color="#9090A0" />
              : <Moon size={18} color="#636366" />}
          </motion.button>
        </motion.div>
      </div>

      {/* XP progress */}
      <motion.div variants={staggerItem}>
        <Card>
          <div className="flex justify-between items-center mb-3">
            <span className="text-base font-bold text-text-primary">Experience</span>
            <span className="text-sm font-semibold text-text-secondary">
              {formatXP(currentUser.xp)} XP total
            </span>
          </div>
          <ProgressBar
            value={progressInLevel}
            max={levelRange}
            showLabel={false}
            label={`Level ${level} → ${level + 1}`}
            height={10}
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-text-muted">Level {level}</span>
            <span className="text-xs text-text-muted">Level {level + 1}</span>
          </div>
        </Card>
      </motion.div>

      {/* Streak */}
      <motion.div variants={staggerItem}>
        <Card>
          <StreakTracker streakWeekends={currentUser.streakWeekends} />
        </Card>
      </motion.div>

      {/* Lifetime stats */}
      <motion.div variants={staggerItem}>
        <Card>
          <h3 className="text-base font-bold text-text-primary mb-3">Lifetime Stats</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Drinks', value: drinkLog.length, emoji: '🍺' },
              { label: 'Parties', value: pastParties.length, emoji: '🎉' },
              { label: 'Streak', value: `${currentUser.streakWeekends}wk`, emoji: '🔥' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1 text-center">
                <span className="text-2xl">{stat.emoji}</span>
                <span className="text-xl font-black text-text-primary">{stat.value}</span>
                <span className="text-xs font-medium text-text-muted">{stat.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Badges */}
      <motion.div variants={staggerItem}>
        <Card>
          <h3 className="text-base font-bold text-text-primary mb-4">
            Badges{' '}
            <span className="text-text-muted font-normal text-sm">
              {currentUser.badges.length}/{allAchievements.length > 0 ? allAchievements.length : ALL_BADGES.length}
            </span>
          </h3>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <BadgeGrid earnedBadges={currentUser.badges} allAchievements={allAchievements} />
          </motion.div>
        </Card>
      </motion.div>

      <SettingsSheet isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </motion.div>
  );
}
