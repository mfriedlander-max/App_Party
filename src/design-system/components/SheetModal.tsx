import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import type { ReactNode } from 'react';
import { slideUp, fadeIn } from '../animations';

interface SheetModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly title?: string;
  readonly className?: string;
}

export function SheetModal({
  isOpen,
  onClose,
  children,
  title,
  className = '',
}: SheetModalProps) {
  const dragControls = useDragControls();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
          />

          {/* Sheet */}
          <motion.div
            variants={slideUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 500) {
                onClose();
              }
            }}
            className={[
              'fixed bottom-0 left-0 right-0 z-50',
              'bg-surface-raised',
              'rounded-t-[20px]',
              'border-t border-border',
              'max-h-[90dvh]',
              'flex flex-col',
              className,
            ].filter(Boolean).join(' ')}
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
          >
            {/* Drag handle */}
            <div
              className="flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-9 h-[5px] rounded-full bg-border" />
            </div>

            {/* Title */}
            {title && (
              <div className="px-4 pb-3 border-b border-border-subtle">
                <h2 className="text-xl font-bold text-text-primary text-center">
                  {title}
                </h2>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
