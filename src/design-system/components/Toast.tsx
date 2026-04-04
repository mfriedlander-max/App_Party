import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { slideDown } from '../animations';

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

interface ToastProps {
  readonly id: string;
  readonly message: string;
  readonly variant?: ToastVariant;
  readonly onDismiss: (id: string) => void;
  readonly duration?: number;
}

const variantConfig: Record<ToastVariant, {
  icon: React.ReactNode;
  bg: string;
  border: string;
  iconColor: string;
}> = {
  success: {
    icon: <CheckCircle size={20} />,
    bg: 'bg-surface-raised',
    border: 'border-[#30D158]',
    iconColor: 'text-[#30D158]',
  },
  warning: {
    icon: <AlertTriangle size={20} />,
    bg: 'bg-surface-raised',
    border: 'border-[#FFD60A]',
    iconColor: 'text-[#FFD60A]',
  },
  error: {
    icon: <XCircle size={20} />,
    bg: 'bg-surface-raised',
    border: 'border-[#FF453A]',
    iconColor: 'text-[#FF453A]',
  },
  info: {
    icon: <Info size={20} />,
    bg: 'bg-surface-raised',
    border: 'border-[#0A84FF]',
    iconColor: 'text-[#0A84FF]',
  },
};

// Auto-dismiss duration: 10s for drunk-friendly long display
const DEFAULT_DURATION = 10_000;

export function Toast({
  id,
  message,
  variant = 'info',
  onDismiss,
  duration = DEFAULT_DURATION,
}: ToastProps) {
  const config = variantConfig[variant];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  return (
    <motion.div
      key={id}
      variants={slideDown}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      className={[
        'flex items-start gap-3',
        'px-4 py-3',
        'rounded-xl',
        'border',
        config.bg,
        config.border,
        'shadow-[0_8px_32px_rgba(0,0,0,0.6)]',
        'max-w-sm w-full',
      ].join(' ')}
    >
      <span className={`flex-shrink-0 mt-0.5 ${config.iconColor}`}>
        {config.icon}
      </span>
      <p className="flex-1 text-text-primary text-base leading-snug">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 text-text-muted hover:text-text-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-1"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}

interface ToastContainerProps {
  readonly toasts: Array<{ id: string; message: string; variant?: ToastVariant }>;
  readonly onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] flex flex-col items-center gap-2 px-4"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            variant={toast.variant}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
