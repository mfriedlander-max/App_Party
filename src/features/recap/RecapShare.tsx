import { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { SheetModal } from '@/design-system/components/SheetModal';
import { useAppStore } from '@/store/app-store';
import type { Recap } from '@/types';

interface RecapShareProps {
  readonly recap: Recap;
}

const SHARE_TARGETS = [
  { id: 'copy', label: 'Copy Link', emoji: '🔗', toast: 'Link copied!' },
  { id: 'instagram', label: 'Instagram', emoji: '📸', toast: 'Opening Instagram…' },
  { id: 'snapchat', label: 'Snapchat', emoji: '👻', toast: 'Opening Snapchat…' },
  { id: 'imessage', label: 'iMessage', emoji: '💬', toast: 'Shared via iMessage!' },
  { id: 'more', label: 'More', emoji: '•••', toast: 'Sharing…' },
] as const;

export function RecapShare({ recap }: RecapShareProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const addToast = useAppStore((s) => s.addToast);
  const firstSlide = recap.slides[0];

  function handleShare(toastMsg: string) {
    setSheetOpen(false);
    addToast({ message: toastMsg, variant: 'success' });
  }

  return (
    <>
      <Button
        variant="primary"
        size="large"
        fullWidth
        onClick={() => setSheetOpen(true)}
      >
        <Share2 size={20} className="mr-2" />
        Share Your Night
      </Button>

      <SheetModal
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Share Recap"
      >
        {/* Preview card */}
        <div
          className="w-full rounded-2xl overflow-hidden mb-6"
          style={{
            background: firstSlide?.backgroundGradient ?? 'linear-gradient(135deg,#667eea,#764ba2)',
            minHeight: 140,
          }}
        >
          <div className="p-6 flex flex-col gap-1">
            <p className="text-white/70 text-sm font-semibold uppercase tracking-wider">
              App Party Recap
            </p>
            <h3 className="text-white text-2xl font-black leading-tight">
              {firstSlide?.heading ?? 'My Night'}
            </h3>
            <p className="text-white/80 text-base font-medium mt-1">
              {firstSlide?.subheading ?? ''}
            </p>
          </div>
        </div>

        {/* Share targets */}
        <div className="flex justify-around pb-4">
          {SHARE_TARGETS.map((target, i) => (
            <motion.button
              key={target.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleShare(target.toast)}
              className="flex flex-col items-center gap-2 min-w-[60px]"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
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
    </>
  );
}
