import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/design-system/animations';

interface StreakTrackerProps {
  readonly streakWeekends: number;
  readonly className?: string;
}

const DISPLAY_COUNT = 8;

function getMultiplier(weekends: number): number {
  if (weekends >= 10) return 1.5;
  if (weekends >= 5) return 1.3;
  if (weekends >= 2) return 1.1;
  return 1.0;
}

export function StreakTracker({ streakWeekends, className = '' }: StreakTrackerProps) {
  const multiplier = getMultiplier(streakWeekends);
  const weekends = Array.from({ length: DISPLAY_COUNT }, (_, i) => {
    const weekendNumber = DISPLAY_COUNT - i;
    return {
      index: weekendNumber,
      active: weekendNumber <= streakWeekends,
    };
  }).reverse();

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-text-primary">Weekend Streak</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-2xl font-black text-[#FF2D55]">{streakWeekends}</span>
          <span className="text-sm font-semibold text-text-secondary">weekends</span>
          {multiplier > 1 && (
            <span
              className="ml-1 text-sm font-black px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,45,85,0.2)', color: '#FF2D55' }}
            >
              {multiplier}x
            </span>
          )}
        </div>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex gap-2"
      >
        {weekends.map((weekend) => (
          <motion.div
            key={weekend.index}
            variants={staggerItem}
            className="flex-1 flex flex-col items-center gap-1"
          >
            <div
              className="w-full aspect-square rounded-full flex items-center justify-center text-base transition-colors"
              style={{
                background: weekend.active
                  ? 'rgba(255,45,85,0.2)'
                  : 'rgba(42,42,56,0.5)',
                border: weekend.active
                  ? '2px solid #FF2D55'
                  : '2px solid var(--theme-border)',
              }}
            >
              {weekend.active ? '🔥' : (
                <span className="w-2 h-2 rounded-full bg-border block" />
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {streakWeekends >= 2 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm font-semibold text-[#FF2D55] mt-3"
        >
          {streakWeekends} weekends × {multiplier}x XP bonus 🔥
        </motion.p>
      )}
    </div>
  );
}
