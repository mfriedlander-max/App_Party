import type { ReactNode } from 'react';
import { Shield, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';

interface TopBarProps {
  readonly title: string;
  readonly rightAction?: ReactNode;
  readonly className?: string;
}

export function TopBar({ title, rightAction, className = '' }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-30',
        'flex items-end',
        'h-[calc(env(safe-area-inset-top,0px)+64px)]',
        className,
      ].filter(Boolean).join(' ')}
      style={{
        background: 'var(--theme-topbar-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--theme-topbar-border)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="flex items-center justify-between w-full px-4 pb-3 h-16">
        {/* Shield — always visible */}
        <div
          className="flex items-center justify-center w-10 h-10 rounded-full"
          style={{
            background: 'rgba(255, 45, 85, 0.1)',
            border: '1px solid rgba(255, 45, 85, 0.2)',
          }}
        >
          <Shield size={20} color="#FF2D55" strokeWidth={2} />
        </div>

        {/* Title */}
        <h1
          className="absolute left-1/2 -translate-x-1/2 text-[1.75rem] font-bold leading-none"
          style={{ color: 'var(--theme-text-primary)' }}
        >
          {title}
        </h1>

        {/* Right: theme toggle + optional right action */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-full cursor-pointer"
            style={{ background: 'var(--theme-surface-raised)' }}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark'
              ? <Sun size={18} color="#9090A0" />
              : <Moon size={18} color="#636366" />}
          </button>
          {rightAction && (
            <div className="w-10 h-10 flex items-center justify-center">
              {rightAction}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
