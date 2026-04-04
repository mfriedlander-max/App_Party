import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { SheetModal } from '@/design-system/components/SheetModal';
import { SegmentedControl } from '@/design-system/components/SegmentedControl';
import { EmptyState } from '@/design-system/components/EmptyState';
import { useDrinkStore } from '@/store/drink-store';
import { useAppStore } from '@/store/app-store';
import { useHaptic } from '@/hooks/use-haptic';
import { xpForDrink } from '@/utils/xp-calculator';
import { staggerContainer, staggerItem } from '@/design-system/animations';
import type { DrinkCatalogItem } from '@/types';

type FilterCategory = 'all' | 'beer' | 'cocktail' | 'shot' | 'wine';

const SEGMENTS = [
  { value: 'all', label: 'All' },
  { value: 'beer', label: 'Beer' },
  { value: 'cocktail', label: 'Cocktail' },
  { value: 'shot', label: 'Shot' },
  { value: 'wine', label: 'Wine' },
] as const;

interface DrinkCatalogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function DrinkCatalog({ isOpen, onClose }: DrinkCatalogProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FilterCategory>('all');

  const catalog = useDrinkStore((s) => s.catalog);
  const addDrink = useDrinkStore((s) => s.addDrink);
  const currentUser = useAppStore((s) => s.currentUser);
  const addToast = useAppStore((s) => s.addToast);
  const awardXP = useAppStore((s) => s.awardXP);
  const haptic = useHaptic();

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return catalog.filter((d) => {
      const matchesCategory = category === 'all' || d.category === category;
      const matchesQuery = !q || d.name.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [catalog, category, query]);

  const handleAdd = (drink: DrinkCatalogItem) => {
    haptic.medium();
    addDrink(drink.id);
    const xp = xpForDrink(currentUser.streakWeekends);
    awardXP(xp);
    addToast({ message: `+${xp} XP — ${drink.name} logged!`, variant: 'success' });
  };

  return (
    <SheetModal isOpen={isOpen} onClose={onClose} title="Drink Catalog">
      <div className="pb-6 flex flex-col gap-4">
        {/* Search bar */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search drinks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-text-primary text-base placeholder:text-text-secondary outline-none focus:border-glow transition-colors"
          />
        </div>

        {/* Category filter */}
        <SegmentedControl
          segments={SEGMENTS}
          value={category}
          onChange={(v) => setCategory(v as FilterCategory)}
        />

        {/* Results */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Search size={48} />}
            title="No drinks found"
            subtitle="No drinks match your search"
          />
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-3"
          >
            {filtered.map((drink) => (
              <motion.button
                key={drink.id}
                variants={staggerItem}
                onClick={() => handleAdd(drink)}
                className="flex flex-col items-center justify-between gap-2 bg-surface-elevated border border-border rounded-xl min-h-[100px] px-3 py-4 cursor-pointer hover:bg-surface-raised active:bg-surface transition-colors text-left"
              >
                <span className="text-3xl leading-none">{drink.emoji}</span>
                <span className="text-text-primary text-base font-semibold text-center leading-tight">
                  {drink.name}
                </span>
                <span className="text-text-secondary text-xs">
                  {drink.standardDrinks.toFixed(1)} std · {drink.abv}% ABV
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </SheetModal>
  );
}
