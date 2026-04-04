import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import { scalePop } from '../animations';

export type BadgeVariant = 'accent' | 'glow' | 'success' | 'warning' | 'muted';
export type BadgeType = 'count' | 'icon' | 'label';

interface CountBadgeProps {
  readonly type: 'count';
  readonly count: number;
  readonly variant?: BadgeVariant;
  readonly max?: number;
}

interface IconBadgeProps {
  readonly type: 'icon';
  readonly icon: ReactNode;
  readonly variant?: BadgeVariant;
  readonly label?: string;
}

interface LabelBadgeProps {
  readonly type: 'label';
  readonly label: string;
  readonly variant?: BadgeVariant;
}

export type BadgeProps = CountBadgeProps | IconBadgeProps | LabelBadgeProps;

const variantStyles: Record<BadgeVariant, string> = {
  accent: 'bg-accent text-white shadow-[0_0_12px_rgba(255,45,85,0.4)]',
  glow: 'bg-glow text-[#0A0A0F] shadow-[0_0_12px_rgba(0,229,255,0.4)]',
  success: 'bg-success text-[#0A0A0F]',
  warning: 'bg-warning text-[#0A0A0F]',
  muted: 'bg-border text-text-secondary',
};

export function Badge(props: BadgeProps) {
  const variant = props.variant ?? 'accent';
  const baseStyles = [
    'inline-flex items-center justify-center',
    'rounded-full',
    'font-bold',
    'select-none',
    variantStyles[variant],
  ].join(' ');

  if (props.type === 'count') {
    const display = props.max !== undefined && props.count > props.max
      ? `${props.max}+`
      : String(props.count);

    return (
      <AnimatePresence mode="wait">
        {props.count > 0 && (
          <motion.span
            key={display}
            variants={scalePop}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`${baseStyles} min-w-[22px] h-[22px] px-1.5 text-xs`}
          >
            {display}
          </motion.span>
        )}
      </AnimatePresence>
    );
  }

  if (props.type === 'icon') {
    return (
      <motion.span
        variants={scalePop}
        initial="hidden"
        animate="visible"
        className={`${baseStyles} w-8 h-8 gap-1 text-sm`}
      >
        {props.icon}
        {props.label && (
          <span className="text-xs font-semibold">{props.label}</span>
        )}
      </motion.span>
    );
  }

  // label type
  return (
    <span className={`${baseStyles} px-3 h-7 text-sm`}>
      {props.label}
    </span>
  );
}
