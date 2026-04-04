import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { fadeIn, staggerContainer, staggerItem } from '../animations';

interface EmptyStateProps {
  readonly icon: ReactNode;
  readonly title: string;
  readonly subtitle?: string;
  readonly ctaLabel?: string;
  readonly onCta?: () => void;
  readonly className?: string;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  ctaLabel,
  onCta,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={`flex flex-col items-center justify-center text-center px-8 py-16 ${className}`}
    >
      <motion.div
        variants={staggerItem}
        className="w-16 h-16 flex items-center justify-center text-accent mb-6"
        style={{ fontSize: 64 }}
      >
        {icon}
      </motion.div>

      <motion.h2
        variants={staggerItem}
        className="text-[1.375rem] font-bold text-text-primary mb-2"
      >
        {title}
      </motion.h2>

      {subtitle && (
        <motion.p
          variants={staggerItem}
          className="text-base text-text-secondary max-w-[280px] leading-relaxed"
        >
          {subtitle}
        </motion.p>
      )}

      {ctaLabel && onCta && (
        <motion.div variants={staggerItem} className="mt-8">
          <Button variant="primary" size="large" onClick={onCta}>
            {ctaLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

// Re-export fadeIn for pages that want to wrap content
export { fadeIn };
