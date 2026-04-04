import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SheetModal } from '@/design-system/components/SheetModal';
import { Button } from '@/design-system/components/Button';
import { useDrinkStore } from '@/store/drink-store';
import { useAppStore } from '@/store/app-store';
import { useHaptic } from '@/hooks/use-haptic';
import { xpForDrink } from '@/utils/xp-calculator';
import type { DrinkCatalogItem } from '@/types';

type Category = 'beer' | 'cocktail' | 'shot' | 'wine';
type Step = 'category' | 'drinks' | 'confirm';

interface CategoryConfig {
  id: Category;
  label: string;
  emoji: string;
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'beer', label: 'Beer', emoji: '🍺' },
  { id: 'cocktail', label: 'Cocktail', emoji: '🍸' },
  { id: 'shot', label: 'Shot', emoji: '🥃' },
  { id: 'wine', label: 'Wine', emoji: '🍷' },
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

export function DrinkLogger({ isOpen, onClose }: DrinkLoggerProps) {
  const [step, setStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedDrink, setSelectedDrink] = useState<DrinkCatalogItem | null>(null);

  const catalog = useDrinkStore((s) => s.catalog);
  const addDrink = useDrinkStore((s) => s.addDrink);
  const currentUser = useAppStore((s) => s.currentUser);
  const addToast = useAppStore((s) => s.addToast);
  const awardXP = useAppStore((s) => s.awardXP);
  const haptic = useHaptic();

  const handleClose = () => {
    onClose();
    // Reset after modal animates out
    setTimeout(() => {
      setStep('category');
      setSelectedCategory(null);
      setSelectedDrink(null);
    }, 300);
  };

  const handleSelectCategory = (cat: Category) => {
    haptic.light();
    setSelectedCategory(cat);
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
    }
  };

  const drinksInCategory = selectedCategory
    ? catalog.filter((d) => d.category === selectedCategory)
    : [];

  const stepTitle =
    step === 'category' ? 'What are you drinking?' :
    step === 'drinks' ? `Choose a ${selectedCategory}` :
    'Confirm Drink';

  return (
    <SheetModal isOpen={isOpen} onClose={handleClose} title={stepTitle}>
      <div className="pb-6">
        {/* Back button (steps 2 and 3) */}
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
              className="grid grid-cols-2 gap-3"
            >
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className="flex flex-col items-center justify-center gap-2 bg-surface-elevated border border-border rounded-xl min-h-[88px] cursor-pointer hover:bg-surface-raised active:bg-surface transition-colors"
                >
                  <span className="text-4xl leading-none">{cat.emoji}</span>
                  <span className="text-text-primary text-lg font-semibold">{cat.label}</span>
                </button>
              ))}
            </motion.div>
          )}

          {/* Step 2 — drink list */}
          {step === 'drinks' && (
            <motion.div
              key="drinks"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="grid grid-cols-2 gap-3"
            >
              {drinksInCategory.map((drink) => (
                <button
                  key={drink.id}
                  onClick={() => handleSelectDrink(drink)}
                  className="flex flex-col items-center justify-center gap-2 bg-surface-elevated border border-border rounded-xl min-h-[88px] px-3 cursor-pointer hover:bg-surface-raised active:bg-surface transition-colors"
                >
                  <span className="text-3xl leading-none">{drink.emoji}</span>
                  <span className="text-text-primary text-base font-semibold text-center leading-tight">
                    {drink.name}
                  </span>
                  <span className="text-text-secondary text-xs">
                    {drink.standardDrinks.toFixed(1)} std
                  </span>
                </button>
              ))}
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
                  {selectedDrink.standardDrinks.toFixed(1)} standard drinks ·{' '}
                  {selectedDrink.abv}% ABV
                </p>
              </div>

              <div className="w-full bg-surface-elevated rounded-xl border border-border p-4 text-center">
                <p className="text-text-secondary text-sm">Est. BAC impact</p>
                <p className="text-glow text-lg font-bold mt-1">
                  +{(selectedDrink.standardDrinks * 0.02).toFixed(3)}
                </p>
              </div>

              <Button
                variant="primary"
                size="large"
                fullWidth
                onClick={handleConfirm}
              >
                Add Drink
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SheetModal>
  );
}
