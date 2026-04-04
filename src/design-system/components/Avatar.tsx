export type AvatarSize = 'sm' | 'md' | 'lg';
export type AvatarStatus = 'online' | 'offline' | 'away' | 'none';

interface AvatarProps {
  readonly seed: string;
  readonly size?: AvatarSize;
  readonly status?: AvatarStatus;
  readonly alt?: string;
  readonly className?: string;
}

const sizeMap: Record<AvatarSize, { px: number; ring: number; offset: number }> = {
  sm: { px: 32, ring: 2, offset: 1 },
  md: { px: 48, ring: 2, offset: 2 },
  lg: { px: 64, ring: 3, offset: 2 },
};

const statusColors: Record<AvatarStatus, string> = {
  online: '#30D158',
  away: '#FFD60A',
  offline: '#5A5A70',
  none: 'transparent',
};

function getDiceBearUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=13131a`;
}

export function Avatar({
  seed,
  size = 'md',
  status = 'none',
  alt,
  className = '',
}: AvatarProps) {
  const { px, ring, offset } = sizeMap[size];
  const showStatus = status !== 'none';
  const statusColor = statusColors[status];
  const statusSize = size === 'sm' ? 8 : size === 'md' ? 10 : 14;

  return (
    <div
      className={`relative inline-flex flex-shrink-0 ${className}`}
      style={{ width: px, height: px }}
    >
      <img
        src={getDiceBearUrl(seed)}
        alt={alt ?? seed}
        width={px}
        height={px}
        style={{
          borderRadius: '50%',
          border: `${ring}px solid #2A2A38`,
          width: px,
          height: px,
          objectFit: 'cover',
          display: 'block',
        }}
      />
      {showStatus && (
        <span
          style={{
            position: 'absolute',
            bottom: offset,
            right: offset,
            width: statusSize,
            height: statusSize,
            borderRadius: '50%',
            backgroundColor: statusColor,
            border: '2px solid #0A0A0F',
          }}
        />
      )}
    </div>
  );
}
