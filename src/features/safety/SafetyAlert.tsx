import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { fadeIn, scalePop } from '@/design-system/animations';
import type { SafetyAlert as SafetyAlertType } from '@/types';

interface SafetyAlertProps {
  readonly alert: SafetyAlertType;
}

export function SafetyAlert({ alert }: SafetyAlertProps) {
  const acknowledgeSafetyAlert = useAppStore((s) => s.acknowledgeSafetyAlert);

  const isWarning = alert.level === 'warning';
  const bg = isWarning ? 'rgba(255,214,10,0.12)' : 'rgba(255,69,58,0.12)';
  const borderColor = isWarning ? '#FFD60A' : '#FF453A';
  const iconColor = isWarning ? '#FFD60A' : '#FF453A';
  const title = isWarning ? 'Slow Down' : 'Time to Stop';
  const subtitle = isWarning
    ? 'Your BAC is getting high. Drink some water and pace yourself.'
    : 'Your BAC is above the legal limit. Stop drinking now and stay safe.';

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-[100] flex items-end justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        variants={scalePop}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-[430px] rounded-2xl p-6 border"
        style={{ background: bg, borderColor }}
      >
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: `${iconColor}22` }}
          >
            {isWarning ? (
              <AlertTriangle size={44} color={iconColor} />
            ) : (
              <ShieldAlert size={44} color={iconColor} />
            )}
          </div>
        </div>

        {/* Text */}
        <h2
          className="text-center text-3xl font-bold mb-3"
          style={{ color: iconColor }}
        >
          {title}
        </h2>
        <p className="text-center text-text-primary text-lg leading-relaxed mb-8">
          {subtitle}
        </p>

        {/* Acknowledge — no tap-outside-to-close; must use this button */}
        <motion.button
          onClick={() => acknowledgeSafetyAlert(alert.id)}
          whileTap={{ scale: 0.95 }}
          className="w-full min-h-[72px] rounded-[12px] font-semibold text-xl flex items-center justify-center cursor-pointer"
          style={{ backgroundColor: iconColor, color: '#0A0A0F' }}
        >
          I Understand
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

/** Renders the first unacknowledged alert, if any. */
export function SafetyAlertOverlay() {
  const notifications = useAppStore((s) => s.notifications);
  const active = notifications.find((n) => !n.acknowledged) ?? null;

  return (
    <AnimatePresence>
      {active && <SafetyAlert key={active.id} alert={active} />}
    </AnimatePresence>
  );
}
