import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { useEffect } from 'react';
import type { RecapSlide as RecapSlideType } from '@/types';

interface RecapSlideProps {
  readonly slide: RecapSlideType;
}

// Count-up number display
function AnimatedNumber({ value }: { value: string }) {
  const numericMatch = value.match(/[\d.]+/);
  const numeric = numericMatch ? parseFloat(numericMatch[0]) : null;
  const prefix = numeric !== null ? value.slice(0, value.indexOf(numericMatch![0])) : '';
  const suffix = numeric !== null ? value.slice(value.indexOf(numericMatch![0]) + numericMatch![0].length) : '';

  const spring = useSpring(0, { stiffness: 60, damping: 20, mass: 1 });
  const display = useTransform(spring, (v) => {
    if (numeric === null) return value;
    const isDecimal = numericMatch![0].includes('.');
    const formatted = isDecimal ? v.toFixed(2) : Math.round(v).toString();
    return `${prefix}${formatted}${suffix}`;
  });

  useEffect(() => {
    if (numeric !== null) {
      spring.set(numeric);
    }
  }, [numeric, spring]);

  if (numeric === null) {
    return (
      <span className="text-7xl font-black text-white leading-none drop-shadow-lg">
        {value}
      </span>
    );
  }

  return (
    <motion.span className="text-7xl font-black text-white leading-none drop-shadow-lg">
      {display}
    </motion.span>
  );
}

// Horizontal bar chart for drink-breakdown
function DrinkBarChart() {
  const categories = [
    { label: 'Beer', pct: 0.35, color: '#FFD60A' },
    { label: 'Cocktail', pct: 0.45, color: '#FF2D55' },
    { label: 'Shot', pct: 0.12, color: '#00E5FF' },
    { label: 'Wine', pct: 0.08, color: '#BF5AF2' },
  ];

  return (
    <div className="w-full space-y-3 px-2">
      {categories.map((cat, i) => (
        <motion.div
          key={cat.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.12, type: 'spring', stiffness: 300, damping: 28 }}
          className="flex items-center gap-3"
        >
          <span className="w-16 text-right text-sm font-semibold text-white/80 shrink-0">
            {cat.label}
          </span>
          <div className="flex-1 h-6 rounded-full overflow-hidden bg-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: cat.color }}
              initial={{ width: 0 }}
              animate={{ width: `${cat.pct * 100}%` }}
              transition={{ delay: i * 0.12 + 0.15, type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
          <span className="text-sm font-bold text-white/60 shrink-0 w-10">
            {Math.round(cat.pct * 100)}%
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// Glow clock display for peak-moment
function GlowClock({ subheading }: { subheading: string }) {
  const timeMatch = subheading.match(/\d+:\d+\s*(AM|PM)?/i);
  const timeStr = timeMatch ? timeMatch[0] : '11:45 PM';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="flex flex-col items-center gap-2"
    >
      <span
        className="text-8xl font-black text-white leading-none"
        style={{
          textShadow: '0 0 40px rgba(0,229,255,0.8), 0 0 80px rgba(0,229,255,0.4)',
        }}
      >
        {timeStr}
      </span>
    </motion.div>
  );
}

// Group photo placeholder
function GroupPhotoPlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="w-64 h-64 rounded-3xl overflow-hidden flex items-center justify-center mx-auto"
      style={{ background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)' }}
    >
      <span className="text-9xl">📸</span>
    </motion.div>
  );
}

export function RecapSlide({ slide }: RecapSlideProps) {
  const motionValue = useMotionValue(0);

  useEffect(() => {
    motionValue.set(1);
  }, [motionValue]);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6"
      style={{ background: slide.backgroundGradient }}
    >
      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="text-4xl font-black text-white text-center leading-tight drop-shadow-lg"
      >
        {slide.heading}
      </motion.h1>

      {/* Variant-specific content */}
      {slide.variant === 'stat-reveal' && slide.value && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 25 }}
          className="flex items-center justify-center"
        >
          <AnimatedNumber value={slide.value} />
        </motion.div>
      )}

      {slide.variant === 'drink-breakdown' && <DrinkBarChart />}

      {slide.variant === 'peak-moment' && (
        <GlowClock subheading={slide.subheading} />
      )}

      {slide.variant === 'group-photo' && <GroupPhotoPlaceholder />}

      {/* Subheading */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 28 }}
        className="text-xl font-semibold text-white/80 text-center leading-snug"
      >
        {slide.subheading}
      </motion.p>
    </div>
  );
}
