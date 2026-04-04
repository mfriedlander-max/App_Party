import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Image, MapPin, Check, X, Shield } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { CameraRollSync } from './CameraRollSync';

type PermissionStatus = 'not-asked' | 'granted' | 'denied';

interface PermissionRowProps {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly description: string;
  readonly status: PermissionStatus;
  readonly statusLabel?: string;
  readonly onRequest: () => Promise<void>;
  readonly onRevoke?: () => void;
}

function StatusIndicator({ status }: { readonly status: PermissionStatus }) {
  if (status === 'granted') {
    return (
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[rgba(52,199,89,0.18)]">
        <Check size={15} className="text-[#34C759]" />
      </span>
    );
  }
  if (status === 'denied') {
    return (
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[rgba(255,69,58,0.18)]">
        <X size={15} className="text-[#FF453A]" />
      </span>
    );
  }
  return (
    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-surface">
      <span className="w-2.5 h-2.5 rounded-full bg-border" />
    </span>
  );
}

function PermissionRow({
  icon,
  title,
  description,
  status,
  statusLabel,
  onRequest,
  onRevoke,
}: PermissionRowProps) {
  const [loading, setLoading] = useState(false);

  async function handleTap() {
    if (status === 'granted' && onRevoke) {
      onRevoke();
      return;
    }
    if (status === 'granted') return;
    setLoading(true);
    await onRequest();
    setLoading(false);
  }

  return (
    <motion.button
      type="button"
      onClick={handleTap}
      disabled={loading}
      className="w-full flex items-center gap-3 px-4 rounded-xl border border-border bg-surface transition-colors"
      style={{ minHeight: 64 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="text-text-secondary flex-shrink-0">{icon}</span>

      <div className="flex-1 text-left py-3">
        <p className="text-text-primary text-base font-semibold leading-tight">{title}</p>
        <p className="text-text-secondary text-sm leading-snug mt-0.5">
          {statusLabel ?? description}
        </p>
      </div>

      <div className="flex-shrink-0 flex items-center gap-2">
        {status === 'not-asked' && (
          <span className="text-[#FF2D55] text-sm font-semibold">
            {loading ? 'Asking…' : 'Tap to enable'}
          </span>
        )}
        {status === 'granted' && (
          <span className="text-text-muted text-sm font-medium">
            Tap to disable
          </span>
        )}
        <StatusIndicator status={status} />
      </div>
    </motion.button>
  );
}

export function PermissionsCard() {
  const camera = usePermissions((s) => s.camera);
  const photos = usePermissions((s) => s.photos);
  const location = usePermissions((s) => s.location);
  const lastLocation = usePermissions((s) => s.lastLocation);
  const requestCamera = usePermissions((s) => s.requestCamera);
  const requestPhotos = usePermissions((s) => s.requestPhotos);
  const requestLocation = usePermissions((s) => s.requestLocation);
  const revokeCamera = usePermissions((s) => s.revokeCamera);
  const revokePhotos = usePermissions((s) => s.revokePhotos);
  const revokeLocation = usePermissions((s) => s.revokeLocation);

  const [showCameraRollSync, setShowCameraRollSync] = useState(false);

  async function handleRequestPhotos() {
    await requestPhotos();
    setShowCameraRollSync(true);
  }

  function locationStatusLabel(): string | undefined {
    if (location === 'granted' && lastLocation) {
      return `Location: ${lastLocation.lat.toFixed(3)}, ${lastLocation.lng.toFixed(3)}`;
    }
    return undefined;
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 px-1">
          <Shield size={16} className="text-text-secondary" />
          <span className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
            Privacy &amp; Permissions
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <PermissionRow
            icon={<Camera size={22} />}
            title="Camera Access"
            description="Take photos of your drinks"
            status={camera}
            onRequest={requestCamera}
            onRevoke={revokeCamera}
          />

          <PermissionRow
            icon={<Image size={22} />}
            title="Photo Library"
            description="Sync your camera roll for night recaps"
            status={photos}
            onRequest={handleRequestPhotos}
            onRevoke={revokePhotos}
          />

          <PermissionRow
            icon={<MapPin size={22} />}
            title="Location"
            description="Tag parties with your location"
            status={location}
            statusLabel={locationStatusLabel()}
            onRequest={requestLocation}
            onRevoke={revokeLocation}
          />
        </div>
      </div>

      <CameraRollSync isOpen={showCameraRollSync} onClose={() => setShowCameraRollSync(false)} />
    </>
  );
}
