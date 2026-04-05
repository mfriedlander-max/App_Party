import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Image } from 'lucide-react';
import { SheetModal } from '@/design-system/components/SheetModal';
import { Button } from '@/design-system/components/Button';
import { uploadMedia } from '@/lib/repositories/media-repository';
import { usePartyStore } from '@/store/party-store';
import { useAppStore } from '@/store/app-store';
import { CURRENT_USER } from '@/data/mock-users';

interface SelectedPhoto {
  readonly file: File;
  readonly previewUrl: string;
}

interface CameraRollSyncProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function CameraRollSync({ isOpen, onClose }: CameraRollSyncProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const activeParty = usePartyStore((s) => s.activeParty);
  const addToast = useAppStore((s) => s.addToast);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const photos: SelectedPhoto[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setSelectedPhotos(photos);
    setUploadedCount(0);
  }

  function handleSelectPhotos() {
    fileInputRef.current?.click();
  }

  async function handleUpload() {
    if (selectedPhotos.length === 0) return;

    setUploading(true);
    let succeeded = 0;

    for (const photo of selectedPhotos) {
      try {
        await uploadMedia(
          CURRENT_USER.id,
          activeParty?.id ?? null,
          photo.file,
          'camera_roll_sync',
        );
        succeeded += 1;
        setUploadedCount(succeeded);
      } catch {
        // Continue uploading remaining photos even if one fails
      }
    }

    // Revoke preview URLs to free memory
    selectedPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));

    setUploading(false);

    if (succeeded > 0) {
      addToast({
        message: `${succeeded} photo${succeeded === 1 ? '' : 's'} synced!`,
        variant: 'success',
      });
    } else {
      addToast({ message: 'Upload failed — try again', variant: 'error' });
    }

    setSelectedPhotos([]);
    onClose();
  }

  function handleClose() {
    // Revoke any pending preview URLs
    selectedPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setSelectedPhotos([]);
    onClose();
  }

  const hasSelection = selectedPhotos.length > 0;

  return (
    <SheetModal isOpen={isOpen} onClose={handleClose}>
      <div className="flex flex-col items-center gap-6 pb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
          aria-hidden="true"
        />

        {/* Header */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="flex flex-col items-center gap-3"
        >
          <span className="flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(52,199,89,0.18)]">
            {hasSelection ? (
              <Check size={32} className="text-[#34C759]" />
            ) : (
              <Image size={32} className="text-[#34C759]" />
            )}
          </span>
          <h2 className="text-2xl font-black text-text-primary">
            {hasSelection ? `${selectedPhotos.length} Photos Selected` : 'Sync Camera Roll'}
          </h2>
          <p className="text-text-secondary text-base text-center">
            {hasSelection
              ? activeParty
                ? `Will be tagged with ${activeParty.name}`
                : 'Will be added to your media'
              : 'Select photos from tonight to add to your party memories'}
          </p>
        </motion.div>

        {/* Photo grid preview */}
        {hasSelection && (
          <div className="grid grid-cols-4 gap-2 w-full">
            {selectedPhotos.map((photo, index) => (
              <motion.div
                key={photo.previewUrl}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.04, duration: 0.25 }}
                className="aspect-square rounded-lg overflow-hidden bg-surface relative"
              >
                <img
                  src={photo.previewUrl}
                  alt={`Selected photo ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {uploading && index < uploadedCount && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Check size={16} className="text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Actions */}
        {!hasSelection && (
          <Button variant="secondary" size="large" fullWidth onClick={handleSelectPhotos}>
            Choose Photos
          </Button>
        )}

        {hasSelection && (
          <div className="flex flex-col gap-3 w-full">
            <Button
              variant="primary"
              size="large"
              fullWidth
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading
                ? `Uploading ${uploadedCount}/${selectedPhotos.length}…`
                : `Upload ${selectedPhotos.length} Photo${selectedPhotos.length === 1 ? '' : 's'}`}
            </Button>
            <Button variant="ghost" size="large" fullWidth onClick={handleSelectPhotos} disabled={uploading}>
              Change Selection
            </Button>
          </div>
        )}

        <Button variant="ghost" size="large" fullWidth onClick={handleClose} disabled={uploading}>
          {hasSelection ? 'Cancel' : 'Done'}
        </Button>
      </div>
    </SheetModal>
  );
}
