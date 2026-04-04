import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressBar } from '@/design-system/components/ProgressBar';
import { Confetti } from '@/features/recap/RecapStats';
import { levelThreshold, xpToLevel } from '@/utils/xp-calculator';
import { scalePop, fadeIn } from '@/design-system/animations';

// ── Floating XP gain text ────────────────────────────────────────────────────

interface FloatingXPProps {
  readonly amount: number;
  readonly visible: boolean;
  readonly onDone?: () => void;
}

export function FloatingXP({ amount, visible, onDone }: FloatingXPProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="floating-xp"
          initial={{ opacity: 0, y: 0, scale: 0.8 }}
          animate={{ opacity: 1, y: -48, scale: 1 }}
          exit={{ opacity: 0, y: -80 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          onAnimationComplete={onDone}
          className="pointer-events-none text-2xl font-black"
          style={{ color: '#00E5FF', textShadow: '0 0 20px rgba(0,229,255,0.6)' }}
        >
          +{amount} XP
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── XP level progress bar ────────────────────────────────────────────────────

interface XPProgressBarProps {
  readonly xp: number;
  readonly className?: string;
}

export function XPProgressBar({ xp, className = '' }: XPProgressBarProps) {
  const level = xpToLevel(xp);
  const currentThreshold = levelThreshold(level);
  const nextThreshold = levelThreshold(level + 1);
  const progressInLevel = xp - currentThreshold;
  const levelRange = nextThreshold - currentThreshold;

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-bold text-text-secondary">Level {level}</span>
        <span className="text-sm font-bold text-text-secondary">Level {level + 1}</span>
      </div>
      <ProgressBar
        value={progressInLevel}
        max={levelRange}
        showLabel={false}
        height={8}
      />
      <div className="flex justify-end mt-1">
        <span className="text-xs text-text-muted">
          {progressInLevel.toLocaleString()} / {levelRange.toLocaleString()} XP
        </span>
      </div>
    </div>
  );
}

// ── Level-up celebration modal ───────────────────────────────────────────────

interface LevelUpCelebrationProps {
  readonly level: number;
  readonly visible: boolean;
  readonly onDismiss: () => void;
}

export function LevelUpCelebration({ level, visible, onDismiss }: LevelUpCelebrationProps) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [visible, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={onDismiss}
        >
          <Confetti count={40} active />

          <motion.div
            variants={scalePop}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-4 text-center px-8"
          >
            <span className="text-7xl">🎉</span>

            <h2 className="text-4xl font-black text-white">Level Up!</h2>

            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-5xl font-black text-white"
              style={{
                background: 'linear-gradient(135deg, #FF2D55, #00E5FF)',
                boxShadow: '0 0 40px rgba(255,45,85,0.5)',
              }}
            >
              {level}
            </div>

            <p className="text-xl font-semibold text-white/70">
              You reached Level {level}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
