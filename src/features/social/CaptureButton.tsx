import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePermissions } from '@/hooks/use-permissions';
import { useAppStore } from '@/store/app-store';
import { uploadMedia } from '@/lib/repositories/media-repository';
import { CURRENT_USER } from '@/data/mock-users';

interface CaptureButtonProps {
  readonly partyId: string;
}

export function CaptureButton({ partyId }: CaptureButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const camera = usePermissions((s) => s.camera);
  const requestCamera = usePermissions((s) => s.requestCamera);
  const addToast = useAppStore((s) => s.addToast);

  async function handleCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadMedia(CURRENT_USER.id, partyId, file, 'in_app_capture');
      addToast({ message: 'Moment captured!', variant: 'success' });
    } catch {
      addToast({ message: 'Failed to upload photo — try again', variant: 'error' });
    } finally {
      setUploading(false);
      // Reset so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handlePress() {
    if (camera !== 'granted') {
      await requestCamera();
    }
    fileInputRef.current?.click();
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCapture}
        aria-hidden="true"
      />

      <AnimatePresence>
        <motion.button
          key="capture-btn"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          whileTap={{ scale: 0.88 }}
          onClick={handlePress}
          disabled={uploading}
          aria-label="Capture moment"
          className="fixed bottom-24 right-5 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#FF2D55] shadow-lg disabled:opacity-60"
        >
          {uploading ? (
            <motion.div
              className="w-6 h-6 rounded-full border-2 border-white border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
            />
          ) : (
            <Camera size={24} color="white" />
          )}
        </motion.button>
      </AnimatePresence>
    </>
  );
}
