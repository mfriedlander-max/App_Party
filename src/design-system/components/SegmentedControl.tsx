import { motion } from 'framer-motion';
import { springs } from '../animations';

interface Segment {
  readonly value: string;
  readonly label: string;
}

interface SegmentedControlProps {
  readonly segments: readonly Segment[];
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly className?: string;
}

export function SegmentedControl({
  segments,
  value,
  onChange,
  className = '',
}: SegmentedControlProps) {
  const activeIndex = segments.findIndex((s) => s.value === value);

  return (
    <div
      role="tablist"
      className={[
        'flex',
        'bg-surface',
        'rounded-xl',
        'p-1',
        'relative',
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* Sliding indicator */}
      {activeIndex >= 0 && (
        <motion.div
          className="absolute top-1 bottom-1 bg-surface-raised rounded-[10px] border border-border"
          style={{
            width: `calc(${100 / segments.length}% - ${8 / segments.length}px)`,
            left: `calc(${(activeIndex / segments.length) * 100}% + 4px)`,
          }}
          layout
          layoutId="segment-indicator"
          transition={springs.tabSwitch}
        />
      )}

      {segments.map((segment) => {
        const isActive = segment.value === value;

        return (
          <button
            key={segment.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(segment.value)}
            className={[
              'flex-1',
              'min-h-[60px]',
              'flex items-center justify-center',
              'text-base font-semibold',
              'rounded-[10px]',
              'relative z-10',
              'transition-colors duration-150',
              'cursor-pointer select-none',
              isActive ? 'text-text-primary' : 'text-text-secondary',
            ].filter(Boolean).join(' ')}
          >
            {segment.label}
          </button>
        );
      })}
    </div>
  );
}
