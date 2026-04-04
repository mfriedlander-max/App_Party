import { motion } from 'framer-motion';
import { Phone, Car } from 'lucide-react';
import { SheetModal } from '@/design-system/components/SheetModal';
import { Button } from '@/design-system/components/Button';
import { staggerContainer, staggerItem } from '@/design-system/animations';

interface Contact {
  readonly id: string;
  readonly name: string;
  readonly relation: string;
  readonly phone: string;
  readonly emoji: string;
}

const MOCK_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Alex Johnson', relation: 'Best Friend', phone: '+1-555-0101', emoji: '👤' },
  { id: 'c2', name: 'Mom', relation: 'Family', phone: '+1-555-0102', emoji: '👩' },
  { id: 'c3', name: 'Riley Chen', relation: 'Roommate', phone: '+1-555-0103', emoji: '🏠' },
];

interface RideService {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
  readonly url: string;
}

const RIDE_SERVICES: RideService[] = [
  { id: 'uber', name: 'Uber', emoji: '🚗', url: 'https://www.uber.com' },
  { id: 'lyft', name: 'Lyft', emoji: '🚙', url: 'https://www.lyft.com' },
];

interface EmergencyContactsProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function EmergencyContacts({ isOpen, onClose }: EmergencyContactsProps) {
  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleRide = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <SheetModal isOpen={isOpen} onClose={onClose} title="Get Help">
      <div className="pb-6 flex flex-col gap-6">
        {/* Emergency contacts */}
        <section>
          <h3 className="text-text-secondary text-sm font-semibold uppercase tracking-widest mb-3">
            Contacts
          </h3>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3"
          >
            {MOCK_CONTACTS.map((contact) => (
              <motion.div
                key={contact.id}
                variants={staggerItem}
                className="bg-surface-elevated border border-border rounded-xl p-4 flex items-center gap-4"
              >
                <span className="text-3xl leading-none">{contact.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary font-semibold text-lg truncate">{contact.name}</p>
                  <p className="text-text-secondary text-sm">{contact.relation}</p>
                </div>
                <Button
                  variant="primary"
                  size="large"
                  onClick={() => handleCall(contact.phone)}
                  className="flex-shrink-0 gap-2"
                >
                  <Phone size={20} />
                  Call
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Ride services */}
        <section>
          <h3 className="text-text-secondary text-sm font-semibold uppercase tracking-widest mb-3">
            Get a Ride
          </h3>
          <div className="flex flex-col gap-3">
            {RIDE_SERVICES.map((service) => (
              <button
                key={service.id}
                onClick={() => handleRide(service.url)}
                className="bg-surface-elevated border border-border rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-surface-raised active:bg-surface transition-colors min-h-[72px] w-full"
              >
                <span className="text-3xl leading-none">{service.emoji}</span>
                <div className="flex-1 text-left">
                  <p className="text-text-primary font-semibold text-lg">{service.name}</p>
                  <p className="text-text-secondary text-sm">Open app</p>
                </div>
                <Car size={24} className="text-[#00E5FF]" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </SheetModal>
  );
}
