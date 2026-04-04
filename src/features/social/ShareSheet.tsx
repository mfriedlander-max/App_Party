import { motion } from 'framer-motion';
import { SheetModal } from '@/design-system/components/SheetModal';
import { useAppStore } from '@/store/app-store';

interface ShareSheetProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const SHARE_TARGETS = [
  { id: 'copy', label: 'Copy Link', emoji: '🔗', toast: 'Copied!' },
  { id: 'instagram', label: 'Instagram', emoji: '📸', toast: 'Shared to Instagram' },
  { id: 'snapchat', label: 'Snapchat', emoji: '👻', toast: 'Shared to Snapchat' },
  { id: 'imessage', label: 'iMessage', emoji: '💬', toast: 'Shared via iMessage' },
  { id: 'more', label: 'More', emoji: '•••', toast: 'Sharing…' },
] as const;

export function ShareSheet({ isOpen, onClose }: ShareSheetProps) {
  const addToast = useAppStore((s) => s.addToast);

  function handleTap(toastMsg: string) {
    onClose();
    addToast({ message: toastMsg, variant: 'success' });
  }

  return (
    <SheetModal isOpen={isOpen} onClose={onClose} title="Share">
      <div className="flex justify-around pb-6">
        {SHARE_TARGETS.map((target, i) => (
          <motion.button
            key={target.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
            whileTap={{ scale: 0.88 }}
            onClick={() => handleTap(target.toast)}
            className="flex flex-col items-center gap-2 min-w-[60px]"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              {target.emoji}
            </div>
            <span className="text-[11px] font-semibold text-text-secondary text-center">
              {target.label}
            </span>
          </motion.button>
        ))}
      </div>
    </SheetModal>
  );
}
