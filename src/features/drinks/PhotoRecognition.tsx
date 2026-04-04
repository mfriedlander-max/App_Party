import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Plus } from 'lucide-react';
import { SheetModal } from '@/design-system/components/SheetModal';
import { Button } from '@/design-system/components/Button';
import { useDrinkStore } from '@/store/drink-store';
import { useAppStore } from '@/store/app-store';
import { useHaptic } from '@/hooks/use-haptic';
import { usePermissions } from '@/hooks/use-permissions';
import { xpForDrink } from '@/utils/xp-calculator';
import type { DrinkCatalogItem } from '@/types';

type ScanState = 'idle' | 'scanning' | 'identified' | 'error';

interface PhotoRecognitionProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function PhotoRecognition({ isOpen, onClose }: PhotoRecognitionProps) {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [identified, setIdentified] = useState<DrinkCatalogItem | null>(null);

  const catalog = useDrinkStore((s) => s.catalog);
  const addDrink = useDrinkStore((s) => s.addDrink);
  const currentUser = useAppStore((s) => s.currentUser);
  const addToast = useAppStore((s) => s.addToast);
  const awardXP = useAppStore((s) => s.awardXP);
  const haptic = useHaptic();
  const cameraPermission = usePermissions((s) => s.camera);
  const requestCamera = usePermissions((s) => s.requestCamera);

  const handleScan = useCallback(async () => {
    if (cameraPermission === 'denied') {
      addToast({ message: 'Camera access needed to scan drinks', variant: 'error' });
      return;
    }
    if (cameraPermission === 'not-asked') {
      await requestCamera();
      const { camera } = usePermissions.getState();
      if (camera !== 'granted') {
        addToast({ message: 'Camera access needed to scan drinks', variant: 'error' });
        return;
      }
    }
    haptic.medium();
    setScanState('scanning');

    setTimeout(() => {
      // Simulate identification — pick a random drink
      const randomIndex = Math.floor(Math.random() * catalog.length);
      const drink = catalog[randomIndex];
      if (drink) {
        setIdentified(drink);
        setScanState('identified');
        haptic.light();
      } else {
        setScanState('error');
      }
    }, 2000);
  }, [catalog, haptic, cameraPermission, requestCamera, addToast]);

  const handleAdd = useCallback(() => {
    if (!identified) return;
    haptic.medium();
    addDrink(identified.id);
    const xp = xpForDrink(currentUser.streakWeekends);
    awardXP(xp);
    addToast({ message: `+${xp} XP — ${identified.name} added!`, variant: 'success' });
    onClose();
    setScanState('idle');
    setIdentified(null);
  }, [identified, haptic, addDrink, currentUser.streakWeekends, awardXP, addToast, onClose]);

  const handleManual = useCallback(() => {
    onClose();
    setScanState('idle');
    setIdentified(null);
  }, [onClose]);

  const handleReset = useCallback(() => {
    setScanState('idle');
    setIdentified(null);
  }, []);

  return (
    <SheetModal isOpen={isOpen} onClose={onClose} title="Scan Your Drink">
      <div className="pb-6 flex flex-col items-center gap-6">
        <AnimatePresence mode="wait">
          {scanState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6 w-full"
            >
              {/* Viewfinder placeholder */}
              <div className="w-full aspect-square max-w-[280px] bg-surface rounded-2xl border-2 border-dashed border-border flex items-center justify-center">
                <Camera size={64} className="text-text-secondary" />
              </div>
              <p className="text-text-secondary text-base text-center">
                Point at your drink to identify it
              </p>
              <Button variant="primary" size="large" fullWidth onClick={handleScan}>
                <Camera size={20} className="mr-2" />
                Scan Drink
              </Button>
            </motion.div>
          )}

          {scanState === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6 w-full"
            >
              {/* Pulsing glow border viewfinder */}
              <motion.div
                className="w-full aspect-square max-w-[280px] bg-surface rounded-2xl flex items-center justify-center"
                animate={{
                  boxShadow: [
                    '0 0 0px 0px rgba(0,229,255,0)',
                    '0 0 30px 8px rgba(0,229,255,0.5)',
                    '0 0 0px 0px rgba(0,229,255,0)',
                  ],
                  borderColor: ['#2A2A38', '#00E5FF', '#2A2A38'],
                }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ border: '2px solid #2A2A38' }}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  <Camera size={64} className="text-[#00E5FF]" />
                </motion.div>
              </motion.div>
              <p className="text-[#00E5FF] text-lg font-semibold">Scanning…</p>
            </motion.div>
          )}

          {scanState === 'identified' && identified && (
            <motion.div
              key="identified"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-5 w-full"
            >
              <span className="text-7xl leading-none">{identified.emoji}</span>
              <div className="text-center">
                <p className="text-text-primary text-2xl font-bold">{identified.name}</p>
                <p className="text-text-secondary text-base mt-1">
                  {identified.standardDrinks.toFixed(1)} std drinks · {identified.abv}% ABV
                </p>
              </div>
              <Button variant="primary" size="large" fullWidth onClick={handleAdd}>
                <Plus size={20} className="mr-2" />
                Add This Drink
              </Button>
              <Button variant="ghost" size="default" fullWidth onClick={handleReset}>
                Try Again
              </Button>
            </motion.div>
          )}

          {scanState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-5 w-full"
            >
              <X size={64} className="text-[#FF453A]" />
              <p className="text-text-primary text-xl font-semibold text-center">
                Could not identify
              </p>
              <p className="text-text-secondary text-base text-center">
                Try better lighting or a clearer angle.
              </p>
              <Button variant="primary" size="large" fullWidth onClick={handleManual}>
                Add Manually
              </Button>
              <Button variant="ghost" size="default" fullWidth onClick={handleReset}>
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SheetModal>
  );
}
