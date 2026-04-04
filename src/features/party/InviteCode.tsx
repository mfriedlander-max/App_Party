import { Copy, Share2 } from 'lucide-react';
import { SheetModal } from '@/design-system/components/SheetModal';
import { Button } from '@/design-system/components/Button';
import { useAppStore } from '@/store/app-store';

interface InviteCodeProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly code: string;
}

export function InviteCode({ isOpen, onClose, code }: InviteCodeProps) {
  const addToast = useAppStore((s) => s.addToast);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      addToast({ message: 'Invite code copied!', variant: 'success' });
    }).catch(() => {
      addToast({ message: 'Failed to copy code', variant: 'error' });
    });
  }

  function handleShare() {
    addToast({ message: 'Share feature coming soon!', variant: 'info' });
  }

  return (
    <SheetModal isOpen={isOpen} onClose={onClose} title="Invite Friends">
      <div className="flex flex-col items-center gap-6 pb-6">
        {/* Code display */}
        <div
          className="w-full flex items-center justify-center py-8 rounded-2xl"
          style={{
            background: 'rgba(0,229,255,0.06)',
            border: '2px solid rgba(0,229,255,0.3)',
            boxShadow: '0 0 32px rgba(0,229,255,0.12)',
          }}
        >
          <span
            className="text-[#00E5FF] font-black tracking-[0.25em] select-all"
            style={{ fontSize: 32, fontFamily: 'monospace' }}
          >
            {code}
          </span>
        </div>

        <p className="text-text-secondary text-center text-base">
          Share this code with friends to invite them to your party
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <Button variant="primary" onClick={handleCopy} fullWidth>
            <Copy size={18} className="mr-2" />
            Copy Code
          </Button>
          <Button variant="secondary" onClick={handleShare} fullWidth>
            <Share2 size={18} className="mr-2" />
            Share
          </Button>
        </div>
      </div>
    </SheetModal>
  );
}
