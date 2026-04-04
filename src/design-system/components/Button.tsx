import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { springs } from '../animations';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'default' | 'large';

interface ButtonProps {
  readonly children: ReactNode;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly disabled?: boolean;
  readonly fullWidth?: boolean;
  readonly onClick?: () => void;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-[#FF2D55] text-white',
    'shadow-[0_0_20px_rgba(255,45,85,0.3)]',
    'hover:bg-[#FF1A45] hover:shadow-[0_0_28px_rgba(255,45,85,0.45)]',
    'active:bg-[#E0002A]',
  ].join(' '),

  secondary: [
    'bg-surface-raised text-text-primary',
    'border border-border',
    'hover:bg-surface-elevated',
  ].join(' '),

  ghost: [
    'bg-transparent text-text-primary',
    'hover:bg-surface-raised',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  default: 'min-h-[60px] px-6 text-[1.125rem]',
  large: 'min-h-[72px] px-8 text-[1.25rem]',
};

function triggerHaptic(): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
}

export function Button({
  children,
  variant = 'primary',
  size = 'default',
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
}: ButtonProps) {
  const handleClick = () => {
    if (!disabled) {
      triggerHaptic();
      onClick?.();
    }
  };

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.95 }}
      transition={springs.snappy}
      className={[
        'inline-flex items-center justify-center',
        'rounded-[12px]',
        'font-semibold',
        'transition-colors duration-150',
        'cursor-pointer select-none',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? 'w-full' : '',
        disabled ? 'opacity-40 pointer-events-none' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </motion.button>
  );
}
