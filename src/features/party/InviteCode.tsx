import { Copy, Share2 } from 'lucide-react';
import { SheetModal } from '@/design-system/components/SheetModal';
import { Button } from '@/design-system/components/Button';
import { useAppStore } from '@/store/app-store';

interface InviteCodeProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly code: string;
}

function buildInviteUrl(code: string): string {
  return `${window.location.origin}/invite/${code}`;
}

export function InviteCode({ isOpen, onClose, code }: InviteCodeProps) {
  const addToast = useAppStore((s) => s.addToast);
  const inviteUrl = buildInviteUrl(code);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      addToast({ message: 'Invite code copied!', variant: 'success' });
    }).catch(() => {
      addToast({ message: 'Failed to copy code', variant: 'error' });
    });
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      addToast({ message: 'Invite link copied!', variant: 'success' });
    }).catch(() => {
      addToast({ message: 'Failed to copy link', variant: 'error' });
    });
  }

  function handleShare() {
    if (typeof navigator.share === 'function') {
      navigator.share({
        title: 'Join my party on App Party!',
        text: `Use code ${code} or tap the link to join`,
        url: inviteUrl,
      }).catch(() => {
        // User dismissed share sheet — not an error
      });
    } else {
      handleCopyLink();
    }
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

        {/* Invite URL */}
        <div
          className="w-full px-4 py-3 rounded-xl text-text-muted text-sm font-mono truncate text-center select-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1E1E28' }}
        >
          {inviteUrl}
        </div>

        <p className="text-text-secondary text-center text-base">
          Share this code or link with friends to invite them to your party
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <Button variant="primary" onClick={handleCopy} fullWidth>
            <Copy size={18} className="mr-2" />
            Copy Code
          </Button>
          <Button variant="secondary" onClick={handleShare} fullWidth>
            <Share2 size={18} className="mr-2" />
            Share Link
          </Button>
        </div>
      </div>
    </SheetModal>
  );
}
