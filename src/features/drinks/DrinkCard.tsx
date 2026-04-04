import { motion } from 'framer-motion';
import type { DrinkLogEntry, DrinkCatalogItem } from '@/types';
import { formatTime } from '@/utils/format';
import { useHaptic } from '@/hooks/use-haptic';

interface DrinkCardProps {
  readonly entry: DrinkLogEntry;
  readonly item: DrinkCatalogItem;
  readonly onDelete: (id: string) => void;
}

const DELETE_THRESHOLD = 80;

export function DrinkCard({ entry, item, onDelete }: DrinkCardProps) {
  const haptic = useHaptic();

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -DELETE_THRESHOLD) {
      haptic.medium();
      onDelete(entry.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -120 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      drag="x"
      dragConstraints={{ left: -120, right: 0 }}
      dragElastic={{ left: 0.2, right: 0 }}
      onDragEnd={handleDragEnd}
      className="relative bg-surface-raised rounded-xl border border-border px-4 py-3 flex items-center gap-3 cursor-grab active:cursor-grabbing select-none"
    >
      {/* Emoji */}
      <span className="text-3xl leading-none">{item.emoji}</span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-text-primary font-semibold text-[1.0625rem] truncate">
          {item.name}
        </p>
        <p className="text-text-secondary text-sm mt-0.5">
          {item.standardDrinks.toFixed(1)} std drinks · {formatTime(entry.loggedAt)}
        </p>
      </div>

      {/* Delete hint — revealed on swipe */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-20 rounded-r-xl pointer-events-none">
        <motion.span
          className="text-[#FF453A] text-xs font-bold uppercase tracking-wider"
          initial={{ opacity: 0 }}
          whileDrag={{ opacity: 1 }}
        >
          Delete
        </motion.span>
      </div>
    </motion.div>
  );
}
