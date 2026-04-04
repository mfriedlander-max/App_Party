import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, scalePop } from '@/design-system/animations';
import { Confetti } from '@/features/recap/RecapStats';
import type { Badge } from '@/types';

interface AchievementUnlockProps {
  readonly badge: Badge | null;
  readonly visible: boolean;
  readonly onDismiss: () => void;
}

export function AchievementUnlock({ badge, visible, onDismiss }: AchievementUnlockProps) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [visible, onDismiss]);

  return (
    <AnimatePresence>
      {visible && badge && (
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.9)' }}
          onClick={onDismiss}
        >
          <Confetti count={35} active />

          <motion.div
            variants={scalePop}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-5 text-center px-8"
          >
            <p
              className="text-sm font-bold uppercase tracking-widest"
              style={{ color: '#00E5FF' }}
            >
              Achievement Unlocked!
            </p>

            {/* Badge emoji with glow */}
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 30px rgba(0,229,255,0.4)',
                  '0 0 60px rgba(0,229,255,0.7)',
                  '0 0 30px rgba(0,229,255,0.4)',
                ],
              }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-28 h-28 rounded-full flex items-center justify-center text-6xl"
              style={{ background: 'rgba(0,229,255,0.1)', border: '2px solid rgba(0,229,255,0.4)' }}
            >
              {badge.emoji}
            </motion.div>

            <div className="flex flex-col gap-1">
              <h2 className="text-3xl font-black text-white">{badge.name}</h2>
              <p className="text-lg text-white/60">{badge.description}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
