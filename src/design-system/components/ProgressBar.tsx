import { motion } from 'framer-motion';

interface ProgressBarProps {
  readonly value: number;
  readonly max?: number;
  readonly showLabel?: boolean;
  readonly label?: string;
  readonly height?: number;
  readonly className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  showLabel = true,
  label,
  height = 8,
  className = '',
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const percent = max > 0 ? (clamped / max) * 100 : 0;
  const displayPercent = Math.round(percent);

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm text-text-secondary font-medium">{label}</span>
          )}
          {showLabel && (
            <span className="text-sm font-bold text-text-primary ml-auto">
              {displayPercent}%
            </span>
          )}
        </div>
      )}

      <div
        className="w-full rounded-full overflow-hidden bg-surface-elevated"
        style={{ height }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #FF2D55 0%, #00E5FF 100%)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{
            type: 'spring',
            stiffness: 120,
            damping: 20,
            mass: 1,
          }}
        />
      </div>
    </div>
  );
}
