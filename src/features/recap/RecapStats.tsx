import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';

// ── Count-up stat ────────────────────────────────────────────────────────────

interface CountUpStatProps {
  readonly value: number;
  readonly suffix?: string;
  readonly prefix?: string;
  readonly duration?: number;
  readonly className?: string;
}

export function CountUpStat({
  value,
  suffix = '',
  prefix = '',
  className = '',
}: CountUpStatProps) {
  const spring = useSpring(0, { stiffness: 60, damping: 20, mass: 1 });
  const display = useTransform(spring, (v) => `${prefix}${Math.round(v)}${suffix}`);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return (
    <motion.span className={className}>
      {display}
    </motion.span>
  );
}

// ── Bar chart reveal ─────────────────────────────────────────────────────────

interface BarChartItem {
  readonly label: string;
  readonly value: number;
  readonly color: string;
}

interface BarChartRevealProps {
  readonly items: BarChartItem[];
}

export function BarChartReveal({ items }: BarChartRevealProps) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="w-full space-y-3">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1, type: 'spring', stiffness: 300, damping: 28 }}
        >
          <span className="w-20 text-right text-sm font-semibold text-white/80 shrink-0">
            {item.label}
          </span>
          <div className="flex-1 h-5 rounded-full overflow-hidden bg-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: item.color }}
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{
                delay: i * 0.1 + 0.1,
                type: 'spring',
                stiffness: 120,
                damping: 20,
              }}
            />
          </div>
          <span className="text-sm font-bold text-white/60 w-8 shrink-0">{item.value}</span>
        </motion.div>
      ))}
    </div>
  );
}

// ── Confetti particles ────────────────────────────────────────────────────────

interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
}

function generateParticles(count: number): Particle[] {
  const colors = ['#FF2D55', '#00E5FF', '#FFD60A', '#30D158', '#BF5AF2', '#FF9F0A'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[i % colors.length],
    delay: Math.random() * 0.6,
    duration: 1.2 + Math.random() * 0.8,
  }));
}

interface ConfettiProps {
  readonly count?: number;
  readonly active?: boolean;
}

export function Confetti({ count = 30, active = true }: ConfettiProps) {
  const particlesRef = useRef<Particle[]>(generateParticles(count));

  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particlesRef.current.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-2.5 h-2.5 rounded-sm"
          style={{ left: `${p.x}%`, backgroundColor: p.color, top: -10 }}
          initial={{ y: -10, opacity: 1, rotate: 0 }}
          animate={{
            y: '110vh',
            opacity: [1, 1, 0],
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
          }}
          transition={{
            delay: p.delay,
            duration: p.duration,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
}
