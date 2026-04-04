import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { SheetModal } from '@/design-system/components/SheetModal';
import { Button } from '@/design-system/components/Button';

const PHOTO_COUNT = 8;
const PLACEHOLDER_PHOTOS = Array.from({ length: PHOTO_COUNT }, (_, i) => ({
  id: i,
  url: `https://picsum.photos/200/200?random=${i + 1}`,
}));

interface CameraRollSyncProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function CameraRollSync({ isOpen, onClose }: CameraRollSyncProps) {
  return (
    <SheetModal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center gap-6 pb-4">
        {/* Header */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="flex flex-col items-center gap-3"
        >
          <span className="flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(52,199,89,0.18)]">
            <Check size={32} className="text-[#34C759]" />
          </span>
          <h2 className="text-2xl font-black text-text-primary">Camera Roll Synced</h2>
          <p className="text-text-secondary text-base text-center">
            We'll automatically find party photos from tonight
          </p>
        </motion.div>

        {/* Photo grid */}
        <div className="grid grid-cols-4 gap-2 w-full">
          {PLACEHOLDER_PHOTOS.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="aspect-square rounded-lg overflow-hidden bg-surface"
            >
              <img
                src={photo.url}
                alt={`Party photo ${photo.id + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </motion.div>
          ))}
        </div>

        <Button variant="primary" size="large" fullWidth onClick={onClose}>
          Done
        </Button>
      </div>
    </SheetModal>
  );
}
