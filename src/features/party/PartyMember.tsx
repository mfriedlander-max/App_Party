import { CheckCircle } from 'lucide-react';
import { Avatar } from '@/design-system/components/Avatar';
import { Badge } from '@/design-system/components/Badge';
import type { User } from '@/types';

interface PartyMemberProps {
  readonly user: User;
  readonly drinkCount: number;
  readonly bac?: number;
  readonly done?: boolean;
}

function getBacColor(bac: number): string {
  if (bac >= 0.08) return '#FF2D55';
  if (bac >= 0.06) return '#FFD60A';
  return '#30D158';
}

function getBacLevel(bac: number): string {
  if (bac >= 0.08) return 'danger';
  if (bac >= 0.06) return 'warning';
  return 'safe';
}

export function PartyMember({ user, drinkCount, bac = 0, done = false }: PartyMemberProps) {
  const bacColor = getBacColor(bac);
  const bacLevel = getBacLevel(bac);

  return (
    <div
      className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-raised border border-border-subtle"
      data-testid="party-member"
    >
      <div className="relative">
        <Avatar seed={user.name} size="md" />
        {/* BAC indicator dot */}
        <span
          data-bac-level={bacLevel}
          style={{
            position: 'absolute',
            bottom: 2,
            right: 2,
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: bacColor,
            border: '2px solid #0A0A0F',
          }}
        />
      </div>
      <p className="text-text-primary text-sm font-semibold text-center truncate w-full">
        {user.name.split(' ')[0]}
      </p>
      {done ? (
        <CheckCircle size={16} className="text-[#30D158]" />
      ) : (
        <Badge type="count" count={drinkCount} variant="accent" />
      )}
    </div>
  );
}
