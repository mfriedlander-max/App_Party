import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { useAppStore } from '@/store/app-store';
import type { Recap } from '@/types';

interface RecapShareProps {
  readonly recap: Recap;
}

export function RecapShare({ recap }: RecapShareProps) {
  const [sharing, setSharing] = useState(false);
  const addToast = useAppStore((s) => s.addToast);
  const firstSlide = recap.slides[0];

  async function handleShare() {
    const shareUrl = `${window.location.origin}/recap/${recap.partyId}`;
    const shareTitle = firstSlide?.heading ?? 'My Night';
    const shareText = firstSlide?.subheading ?? 'Check out my party recap!';

    setSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        addToast({ message: 'Shared!', variant: 'success' });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        addToast({ message: 'Link copied to clipboard!', variant: 'success' });
      }
    } catch (err) {
      // User cancelled share dialog — not an error worth surfacing
      if (err instanceof Error && err.name !== 'AbortError') {
        addToast({ message: 'Could not share recap — try again', variant: 'error' });
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <Button
      variant="primary"
      size="large"
      fullWidth
      onClick={handleShare}
      disabled={sharing}
    >
      <Share2 size={20} className="mr-2" />
      Share Your Night
    </Button>
  );
}
