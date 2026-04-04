import type { ReactNode } from 'react';

export type CardGlow = 'none' | 'cyan' | 'accent';

interface CardProps {
  readonly children: ReactNode;
  readonly glow?: CardGlow;
  readonly padding?: boolean;
  readonly className?: string;
  readonly onClick?: () => void;
}

const glowStyles: Record<CardGlow, string> = {
  none: 'border-border',
  cyan: 'border-[rgba(0,229,255,0.4)] shadow-[0_0_20px_rgba(0,229,255,0.15)]',
  accent: 'border-[rgba(255,45,85,0.4)] shadow-[0_0_20px_rgba(255,45,85,0.15)]',
};

export function Card({
  children,
  glow = 'none',
  padding = true,
  className = '',
  onClick,
}: CardProps) {
  const isInteractive = onClick !== undefined;

  return (
    <div
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      className={[
        'bg-surface-raised',
        'rounded-xl',
        'border',
        glowStyles[glow],
        padding ? 'p-4' : '',
        isInteractive ? 'cursor-pointer transition-colors hover:bg-surface-elevated active:bg-surface' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}
