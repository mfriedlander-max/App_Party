import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Clock, TrendingUp, Shield } from 'lucide-react';
import { SheetModal } from '@/design-system/components/SheetModal';
import { EmptyState } from '@/design-system/components/EmptyState';
import { useDrinkStore } from '@/store/drink-store';
import { useAppStore } from '@/store/app-store';
import { calculateBAC } from '@/utils/bac-calculator';
import { formatBAC, formatTime } from '@/utils/format';
import { staggerContainer, staggerItem } from '@/design-system/animations';

type BACLevel = 'safe' | 'warning' | 'danger';

function getBACLevel(bac: number): BACLevel {
  if (bac >= 0.08) return 'danger';
  if (bac >= 0.06) return 'warning';
  return 'safe';
}

const LEVEL_COLORS: Record<BACLevel, string> = {
  safe: '#30D158',
  warning: '#FFD60A',
  danger: '#FF453A',
};

interface StatCardProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string;
  readonly color?: string;
}

function StatCard({ icon, label, value, color = '#F0F0F5' }: StatCardProps) {
  return (
    <motion.div
      variants={staggerItem}
      className="bg-surface-elevated border border-border rounded-xl p-4 flex items-center gap-4"
    >
      <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-text-secondary text-sm">{label}</p>
        <p className="font-bold text-xl mt-0.5" style={{ color }}>{value}</p>
      </div>
    </motion.div>
  );
}

interface SafetyDashboardProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function SafetyDashboard({ isOpen, onClose }: SafetyDashboardProps) {
  const log = useDrinkStore((s) => s.log);
  const catalog = useDrinkStore((s) => s.catalog);
  const currentUser = useAppStore((s) => s.currentUser);

  const stats = useMemo(() => {
    if (log.length === 0) return null;

    const now = Date.now();
    const timestamps = log.map((e) => new Date(e.loggedAt).getTime());
    const firstDrinkMs = Math.min(...timestamps);
    const lastDrinkMs = Math.max(...timestamps);
    const hoursElapsed = (now - firstDrinkMs) / 3_600_000;

    const totalStandardDrinks = log.reduce((sum, entry) => {
      const item = catalog.find((c) => c.id === entry.catalogItemId);
      return sum + (item?.standardDrinks ?? 0);
    }, 0);

    const bac = calculateBAC({
      standardDrinks: totalStandardDrinks,
      weightKg: currentUser.weightKg,
      biologicalSex: currentUser.biologicalSex,
      hoursElapsed,
    });

    const minutesSinceLastDrink = (now - lastDrinkMs) / 60_000;
    const drinksPerHour = hoursElapsed > 0 ? totalStandardDrinks / hoursElapsed : totalStandardDrinks;

    return { bac, drinksPerHour, minutesSinceLastDrink, lastDrinkMs };
  }, [log, catalog, currentUser]);

  return (
    <SheetModal isOpen={isOpen} onClose={onClose} title="Safety Stats">
      <div className="pb-6">
        {stats === null ? (
          <EmptyState
            icon={<Shield size={48} />}
            title="No data yet"
            subtitle="Log drinks to see safety stats"
          />
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3"
          >
            {/* BAC */}
            <StatCard
              icon={<Shield size={24} color={LEVEL_COLORS[getBACLevel(stats.bac)]} />}
              label="Current BAC"
              value={formatBAC(stats.bac)}
              color={LEVEL_COLORS[getBACLevel(stats.bac)]}
            />

            {/* Drinking pace */}
            <StatCard
              icon={<TrendingUp size={24} color="#00E5FF" />}
              label="Drinking pace"
              value={`${stats.drinksPerHour.toFixed(1)} drinks/hr`}
            />

            {/* Time since last drink */}
            <StatCard
              icon={<Clock size={24} color="#9090A0" />}
              label="Last drink"
              value={formatTime(new Date(stats.lastDrinkMs))}
            />

            {/* Hydration reminder */}
            <motion.div
              variants={staggerItem}
              className="bg-[rgba(0,229,255,0.08)] border border-[rgba(0,229,255,0.25)] rounded-xl p-4 flex items-start gap-3"
            >
              <Droplets size={22} color="#00E5FF" className="flex-shrink-0 mt-0.5" />
              <p className="text-text-primary text-base leading-relaxed">
                {stats.minutesSinceLastDrink < 30
                  ? 'Drink a glass of water between each alcoholic drink.'
                  : 'Good job slowing down! Keep hydrating.'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </div>
    </SheetModal>
  );
}
