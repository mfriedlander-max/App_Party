import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { SheetModal } from '@/design-system/components/SheetModal';
import { Button } from '@/design-system/components/Button';
import { useDrinkStore } from '@/store/drink-store';
import { useAppStore } from '@/store/app-store';
import { useHaptic } from '@/hooks/use-haptic';
import { xpForDrink } from '@/utils/xp-calculator';
import { PhotoRecognition } from './PhotoRecognition';
import type { DrinkCatalogItem } from '@/types';

type Category = 'beer' | 'cocktail' | 'shot' | 'wine' | 'spirit' | 'other';
type Step = 'category' | 'drinks' | 'confirm';

interface CategoryConfig {
  id: Category;
  label: string;
  emoji: string;
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'beer',     label: 'Beer',     emoji: '🍺' },
  { id: 'cocktail', label: 'Cocktail', emoji: '🍸' },
  { id: 'shot',     label: 'Shot',     emoji: '🥃' },
  { id: 'wine',     label: 'Wine',     emoji: '🍷' },
  { id: 'spirit',   label: 'Spirit',   emoji: '🥃' },
  { id: 'other',    label: 'Other',    emoji: '🥤' },
];

const slideVariants: import('framer-motion').Variants = {
  enter: { x: 40, opacity: 0 },
  center: { x: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 400, damping: 32 } },
  exit: { x: -40, opacity: 0, transition: { duration: 0.15 } },
};

interface DrinkLoggerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

/** Sort branded drinks first, then alphabetically within each group */
function sortDrinks(drinks: DrinkCatalogItem[]): DrinkCatalogItem[] {
  return [...drinks].sort((a, b) => {
    const aBranded = Boolean((a as DrinkCatalogItem & { brand?: string }).brand);
    const bBranded = Boolean((b as DrinkCatalogItem & { brand?: string }).brand);
    if (aBranded && !bBranded) return -1;
    if (!aBranded && bBranded) return 1;
    return a.name.localeCompare(b.name);
  });
}

export function DrinkLogger({ isOpen, onClose }: DrinkLoggerProps) {
  const [step, setStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedDrink, setSelectedDrink] = useState<DrinkCatalogItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [scanOpen, setScanOpen] = useState(false);

  const catalog = useDrinkStore((s) => s.catalog);
  const addDrink = useDrinkStore((s) => s.addDrink);
  const currentUser = useAppStore((s) => s.currentUser);
  const addToast = useAppStore((s) => s.addToast);
  const awardXP = useAppStore((s) => s.awardXP);
  const haptic = useHaptic();

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep('category');
      setSelectedCategory(null);
      setSelectedDrink(null);
      setSearchQuery('');
    }, 300);
  };

  const handleSelectCategory = (cat: Category) => {
    haptic.light();
    setSelectedCategory(cat);
    setSearchQuery('');
    setStep('drinks');
  };

  const handleSelectDrink = (drink: DrinkCatalogItem) => {
    haptic.light();
    setSelectedDrink(drink);
    setStep('confirm');
  };

  const handleConfirm = () => {
    if (!selectedDrink) return;
    haptic.medium();
    addDrink(selectedDrink.id);
    const xp = xpForDrink(currentUser.streakWeekends);
    awardXP(xp);
    addToast({ message: `+${xp} XP — ${selectedDrink.name} logged!`, variant: 'success' });
    handleClose();
  };

  const handleBack = () => {
    haptic.light();
    if (step === 'confirm') {
      setStep('drinks');
      setSelectedDrink(null);
    } else if (step === 'drinks') {
      setStep('category');
      setSelectedCategory(null);
      setSearchQuery('');
    }
  };

  const handleOpenScan = () => {
    haptic.light();
    setScanOpen(true);
  };

  const handleScanClose = () => {
    setScanOpen(false);
    handleClose();
  };

  // Filter and sort drinks for the selected category
  const drinksInCategory = useMemo(() => {
    if (!selectedCategory) return [];
    const filtered = catalog.filter((d) => d.category === selectedCategory);
    const q = searchQuery.trim().toLowerCase();
    const searched = q
      ? filtered.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            ((d as DrinkCatalogItem & { brand?: string }).brand ?? '').toLowerCase().includes(q),
        )
      : filtered;
    return sortDrinks(searched);
  }, [catalog, selectedCategory, searchQuery]);

  // Group drinks: branded first, then generics
  const brandedDrinks = useMemo(
    () => drinksInCategory.filter((d) => Boolean((d as DrinkCatalogItem & { brand?: string }).brand)),
    [drinksInCategory],
  );
  const genericDrinks = useMemo(
    () => drinksInCategory.filter((d) => !Boolean((d as DrinkCatalogItem & { brand?: string }).brand)),
    [drinksInCategory],
  );

  const stepTitle =
    step === 'category' ? 'What are you drinking?' :
    step === 'drinks' ? `Choose a ${selectedCategory ?? 'drink'}` :
    'Confirm Drink';

  return (
    <>
      <SheetModal isOpen={isOpen} onClose={handleClose} title={stepTitle}>
        <div className="pb-6">
          {step !== 'category' && (
            <button
              onClick={handleBack}
              className="mb-4 text-glow text-base font-semibold cursor-pointer"
            >
              ← Back
            </button>
          )}

          <AnimatePresence>
            {/* Step 1 — category grid */}
            {step === 'category' && (
              <motion.div
                key="category"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex flex-col gap-4"
              >
                <button
                  onClick={handleOpenScan}
                  className="flex items-center justify-center gap-3 bg-surface-elevated border border-glow/40 rounded-xl min-h-[56px] px-4 cursor-pointer hover:bg-surface-raised active:bg-surface transition-colors text-glow font-semibold text-base"
                >
                  <span className="text-2xl leading-none">📷</span>
                  Scan with AI
                </button>

                <p className="text-text-secondary text-xs text-center">— or pick a category —</p>

                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat.id)}
                      className="flex flex-col items-center justify-center gap-2 bg-surface-elevated border border-border rounded-xl min-h-[88px] cursor-pointer hover:bg-surface-raised active:bg-surface transition-colors"
                    >
                      <span className="text-4xl leading-none">{cat.emoji}</span>
                      <span className="text-text-primary text-lg font-semibold">{cat.label}</span>
                      <span className="text-text-secondary text-xs">
                        {catalog.filter((d) => d.category === cat.id).length} drinks
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2 — drink list with search */}
            {step === 'drinks' && (
              <motion.div
                key="drinks"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex flex-col gap-4"
              >
                {/* Search bar */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input
                    type="text"
                    placeholder="Search drinks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-xl pl-9 pr-4 py-3 text-text-primary text-sm focus:outline-none focus:border-glow"
                  />
                </div>

                {/* Branded drinks section */}
                {brandedDrinks.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-text-secondary text-xs font-semibold uppercase tracking-wide px-1">
                      Branded
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {brandedDrinks.map((drink) => (
                        <DrinkCard
                          key={drink.id}
                          drink={drink}
                          onSelect={handleSelectDrink}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Generic / classic section */}
                {genericDrinks.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-text-secondary text-xs font-semibold uppercase tracking-wide px-1">
                      Classic
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {genericDrinks.map((drink) => (
                        <DrinkCard
                          key={drink.id}
                          drink={drink}
                          onSelect={handleSelectDrink}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {drinksInCategory.length === 0 && (
                  <p className="text-text-secondary text-sm text-center py-8">
                    No drinks found{searchQuery ? ` for "${searchQuery}"` : ''}.
                  </p>
                )}
              </motion.div>
            )}

            {/* Step 3 — confirm */}
            {step === 'confirm' && selectedDrink && (
              <motion.div
                key="confirm"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex flex-col items-center gap-6 py-4"
              >
                <span className="text-7xl leading-none">{selectedDrink.emoji}</span>
                <div className="text-center">
                  <p className="text-text-primary text-2xl font-bold">{selectedDrink.name}</p>
                  <p className="text-text-secondary text-base mt-1">
                    {(selectedDrink.abv * 100).toFixed(1)}% ABV · {selectedDrink.volumeMl} mL
                  </p>
                  <p className="text-text-secondary text-sm mt-0.5">
                    {selectedDrink.standardDrinks.toFixed(1)} standard drinks
                  </p>
                </div>

                <div className="w-full bg-surface-elevated rounded-xl border border-border p-4 text-center">
                  <p className="text-text-secondary text-sm">Est. BAC impact</p>
                  <p className="text-glow text-lg font-bold mt-1">
                    +{(selectedDrink.standardDrinks * 0.02).toFixed(3)}
                  </p>
                </div>

                <Button variant="primary" size="large" fullWidth onClick={handleConfirm}>
                  Add Drink
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetModal>

      <PhotoRecognition isOpen={scanOpen} onClose={handleScanClose} />
    </>
  );
}

// ── Sub-component ─────────────────────────────────────────────────────────────

interface DrinkCardProps {
  readonly drink: DrinkCatalogItem;
  readonly onSelect: (drink: DrinkCatalogItem) => void;
}

function DrinkCard({ drink, onSelect }: DrinkCardProps) {
  const brand = (drink as DrinkCatalogItem & { brand?: string }).brand;
  return (
    <button
      onClick={() => onSelect(drink)}
      className="flex flex-col items-center justify-center gap-1 bg-surface-elevated border border-border rounded-xl min-h-[96px] px-3 py-3 cursor-pointer hover:bg-surface-raised active:bg-surface transition-colors"
    >
      <span className="text-3xl leading-none">{drink.emoji}</span>
      <span className="text-text-primary text-sm font-semibold text-center leading-tight line-clamp-2">
        {drink.name}
      </span>
      {brand && (
        <span className="text-text-secondary text-xs text-center leading-tight">{brand}</span>
      )}
      <span className="text-text-secondary text-xs">
        {(drink.abv * 100).toFixed(1)}% · {drink.standardDrinks.toFixed(1)} std
      </span>
    </button>
  );
}
