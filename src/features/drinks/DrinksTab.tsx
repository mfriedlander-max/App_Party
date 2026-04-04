import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Wine, Camera, BookOpen } from 'lucide-react';
import { EmptyState } from '@/design-system/components/EmptyState';
import { BACMeter } from './BACMeter';
import { DrinkLogger } from './DrinkLogger';
import { DrinkCard } from './DrinkCard';
import { PhotoRecognition } from './PhotoRecognition';
import { DrinkCatalog } from './DrinkCatalog';
import { useDrinkStore } from '@/store/drink-store';
import { staggerContainer, staggerItem, springs } from '@/design-system/animations';

type Sheet = 'none' | 'logger' | 'photo' | 'catalog';

export function DrinksTab() {
  const [openSheet, setOpenSheet] = useState<Sheet>('none');

  const log = useDrinkStore((s) => s.log);
  const catalog = useDrinkStore((s) => s.catalog);
  const removeDrink = useDrinkStore((s) => s.removeDrink);

  // Reverse chronological order
  const sortedLog = [...log].reverse();

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-6">
      {/* BAC Meter — top section */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="flex justify-center py-6"
      >
        <BACMeter />
      </motion.div>

      {/* Quick action row */}
      <div className="flex gap-2 mb-6">
        <motion.button
          onClick={() => setOpenSheet('photo')}
          whileTap={{ scale: 0.97 }}
          transition={springs.snappy}
          className="flex-1 flex items-center justify-center gap-2 bg-surface-raised border border-border rounded-xl min-h-[60px] text-text-secondary text-base font-semibold hover:bg-surface-elevated transition-colors cursor-pointer"
        >
          <Camera size={18} />
          Scan
        </motion.button>
        <motion.button
          onClick={() => setOpenSheet('catalog')}
          whileTap={{ scale: 0.97 }}
          transition={springs.snappy}
          className="flex-1 flex items-center justify-center gap-2 bg-surface-raised border border-border rounded-xl min-h-[60px] text-text-secondary text-base font-semibold hover:bg-surface-elevated transition-colors cursor-pointer"
        >
          <BookOpen size={18} />
          Browse
        </motion.button>
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-text-primary font-bold text-lg">Tonight's Drinks</h2>
        {log.length > 0 && (
          <span className="text-text-secondary text-base">
            {log.length} {log.length === 1 ? 'drink' : 'drinks'}
          </span>
        )}
      </div>

      {/* Drink log list or empty state */}
      {sortedLog.length === 0 ? (
        <EmptyState
          icon={<Wine size={56} />}
          title="No drinks yet"
          subtitle="Tap + to log your first drink"
          className="flex-1"
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-2 flex-1"
        >
          <AnimatePresence initial={false}>
            {sortedLog.map((entry) => {
              const item = catalog.find((c) => c.id === entry.catalogItemId);
              if (!item) return null;
              return (
                <motion.div key={entry.id} variants={staggerItem}>
                  <DrinkCard
                    entry={entry}
                    item={item}
                    onDelete={removeDrink}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* FAB — primary CTA, 72px */}
      <motion.button
        onClick={() => setOpenSheet('logger')}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+88px)] right-4 w-[72px] h-[72px] rounded-full bg-[#FF2D55] flex items-center justify-center z-30 cursor-pointer"
        style={{ boxShadow: '0 0 28px rgba(255,45,85,0.45)' }}
        aria-label="Log a drink"
      >
        <Plus size={32} color="white" strokeWidth={2.5} />
      </motion.button>

      {/* Modals */}
      <DrinkLogger
        isOpen={openSheet === 'logger'}
        onClose={() => setOpenSheet('none')}
      />
      <PhotoRecognition
        isOpen={openSheet === 'photo'}
        onClose={() => setOpenSheet('none')}
      />
      <DrinkCatalog
        isOpen={openSheet === 'catalog'}
        onClose={() => setOpenSheet('none')}
      />
    </div>
  );
}
