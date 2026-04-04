import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { SheetModal } from '@/design-system/components/SheetModal';
import { Button } from '@/design-system/components/Button';
import { Avatar } from '@/design-system/components/Avatar';
import { usePartyStore } from '@/store/party-store';
import { useHaptic } from '@/hooks/use-haptic';
import { usePermissions } from '@/hooks/use-permissions';
import { MOCK_USERS, CURRENT_USER } from '@/data/mock-users';

interface CreatePartyProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const OTHER_USERS = MOCK_USERS.filter((u) => u.id !== CURRENT_USER.id);

export function CreateParty({ isOpen, onClose }: CreatePartyProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [nameError, setNameError] = useState('');

  const createParty = usePartyStore((s) => s.createParty);
  const haptic = useHaptic();

  const locationPermission = usePermissions((s) => s.location);
  const lastLocation = usePermissions((s) => s.lastLocation);

  const locationPlaceholder =
    locationPermission === 'granted' && lastLocation
      ? `Near ${lastLocation.lat.toFixed(3)}, ${lastLocation.lng.toFixed(3)}`
      : 'e.g. The Rooftop Bar, Downtown';

  const locationDefault =
    locationPermission === 'granted' && lastLocation && location === ''
      ? `Near ${lastLocation.lat.toFixed(3)}, ${lastLocation.lng.toFixed(3)}`
      : location;

  function toggleMember(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleCreate() {
    if (!name.trim()) {
      setNameError('Party name is required');
      return;
    }
    setNameError('');
    haptic.medium();
    createParty(name.trim(), location.trim(), selectedIds);
    onClose();
    setName('');
    setLocation('');
    setSelectedIds([]);
  }

  return (
    <SheetModal isOpen={isOpen} onClose={onClose} title="Create Party">
      <div className="flex flex-col gap-5 pb-6">
        {/* Party name input */}
        <div className="flex flex-col gap-2">
          <label className="text-text-primary text-base font-semibold" htmlFor="party-name">
            Party Name *
          </label>
          <input
            id="party-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (e.target.value.trim()) setNameError('');
            }}
            placeholder="e.g. Friday Night Rooftop"
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary text-base placeholder:text-text-muted outline-none focus:border-accent transition-colors"
          />
          {nameError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[#FF2D55] text-base"
            >
              {nameError}
            </motion.p>
          )}
        </div>

        {/* Location input */}
        <div className="flex flex-col gap-2">
          <label className="text-text-primary text-base font-semibold" htmlFor="party-location">
            Location
          </label>
          <div className="relative">
            {locationPermission === 'granted' && (
              <MapPin
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FF2D55] pointer-events-none"
              />
            )}
            <input
              id="party-location"
              type="text"
              value={locationDefault}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={locationPlaceholder}
              className={[
                'w-full bg-surface border border-border rounded-xl py-3 text-text-primary text-base placeholder:text-text-muted outline-none focus:border-accent transition-colors',
                locationPermission === 'granted' ? 'pl-9 pr-4' : 'px-4',
              ].join(' ')}
            />
          </div>
        </div>

        {/* Friend selection */}
        <div className="flex flex-col gap-3">
          <p className="text-text-primary text-base font-semibold">Invite Friends</p>
          <div className="flex flex-col gap-2">
            {OTHER_USERS.map((user) => {
              const selected = selectedIds.includes(user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => toggleMember(user.id)}
                  className="flex items-center gap-3 p-3 min-h-[60px] rounded-xl cursor-pointer transition-colors"
                  style={{
                    background: selected ? 'rgba(255,45,85,0.08)' : '#13131A',
                    border: selected ? '1.5px solid rgba(255,45,85,0.4)' : '1px solid #1E1E28',
                  }}
                >
                  <Avatar seed={user.name} size="sm" />
                  <span className="flex-1 text-text-primary text-base font-medium text-left">
                    {user.name}
                  </span>
                  <span
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{
                      borderColor: selected ? '#FF2D55' : '#2A2A38',
                      background: selected ? '#FF2D55' : 'transparent',
                    }}
                  >
                    {selected && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2 6L5 9L10 3"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Create button */}
        <Button variant="primary" size="large" onClick={handleCreate} fullWidth>
          Create Party
        </Button>
      </div>
    </SheetModal>
  );
}
