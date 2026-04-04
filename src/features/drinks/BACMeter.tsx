import { useState, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useDrinkStore } from '@/store/drink-store';
import { useAppStore } from '@/store/app-store';
import { computeCurrentBAC } from '@/utils/bac-calculator';
import { formatBAC } from '@/utils/format';

type BACLevel = 'safe' | 'warning' | 'danger';

const BAC_COLORS: Record<BACLevel, string> = {
  safe: '#30D158',
  warning: '#FFD60A',
  danger: '#FF453A',
};

const BAC_GLOW: Record<BACLevel, string> = {
  safe: 'rgba(48,209,88,0.35)',
  warning: 'rgba(255,214,10,0.35)',
  danger: 'rgba(255,69,58,0.35)',
};

function getBACLevel(bac: number): BACLevel {
  if (bac >= 0.08) return 'danger';
  if (bac >= 0.06) return 'warning';
  return 'safe';
}

// Radius and circumference for the SVG circle gauge
const RADIUS = 72;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const MAX_BAC = 0.2; // scale: 0 → MAX_BAC maps to full stroke

interface BACMeterProps {
  /** Override BAC for testing purposes */
  readonly bac?: number;
}

export function BACMeter({ bac: bacOverride }: BACMeterProps) {
  const log = useDrinkStore((s) => s.log);
  const catalog = useDrinkStore((s) => s.catalog);
  const currentUser = useAppStore((s) => s.currentUser);

  const [computedBAC, setComputedBAC] = useState(() =>
    computeCurrentBAC(log, catalog, currentUser),
  );

  useEffect(() => {
    setComputedBAC(computeCurrentBAC(log, catalog, currentUser));

    const id = setInterval(() => {
      setComputedBAC(computeCurrentBAC(log, catalog, currentUser));
    }, 30_000);

    return () => clearInterval(id);
  }, [log, catalog, currentUser]);

  const bac = bacOverride ?? computedBAC;
  const level = getBACLevel(bac);
  const color = BAC_COLORS[level];
  const glow = BAC_GLOW[level];

  // Stroke dash offset drives the arc fill
  const progress = Math.min(bac / MAX_BAC, 1);
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  // Animated spring for the numeric display
  const springValue = useSpring(bac, { stiffness: 80, damping: 20 });
  const displayBAC = useTransform(springValue, (v) => formatBAC(v));

  return (
    <div
      role="meter"
      aria-label={`Blood alcohol content: ${formatBAC(bac)}`}
      aria-valuenow={bac}
      aria-valuemin={0}
      aria-valuemax={MAX_BAC}
      data-bac-level={level}
      className="flex flex-col items-center"
    >
      <div className="relative" style={{ width: 180, height: 180 }}>
        {/* Glow background */}
        <motion.div
          animate={{ boxShadow: `0 0 40px 12px ${glow}` }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full"
        />

        {/* SVG gauge */}
        <svg width={180} height={180} className="absolute inset-0 -rotate-90">
          {/* Track */}
          <circle
            cx={90}
            cy={90}
            r={RADIUS}
            fill="none"
            stroke="#2A2A38"
            strokeWidth={10}
          />
          {/* Filled arc */}
          <motion.circle
            cx={90}
            cy={90}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            animate={{ strokeDashoffset, stroke: color }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-bold tabular-nums"
            style={{ fontSize: 36, color, lineHeight: 1 }}
            animate={{ color }}
            transition={{ duration: 0.4 }}
          >
            {displayBAC}
          </motion.span>
          <span className="text-text-secondary text-xs mt-1 font-medium uppercase tracking-widest">
            BAC
          </span>
        </div>
      </div>

      {/* Level label */}
      <motion.span
        className="mt-3 text-sm font-semibold uppercase tracking-wider"
        animate={{ color }}
        transition={{ duration: 0.4 }}
      >
        {level === 'safe' ? 'Safe to drink' : level === 'warning' ? 'Slow down' : 'Stop drinking'}
      </motion.span>
    </div>
  );
}
