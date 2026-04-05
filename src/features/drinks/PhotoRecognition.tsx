import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Plus, Barcode } from 'lucide-react';
import { SheetModal } from '@/design-system/components/SheetModal';
import { Button } from '@/design-system/components/Button';
import { useDrinkStore } from '@/store/drink-store';
import { useAppStore } from '@/store/app-store';
import { useHaptic } from '@/hooks/use-haptic';
import { usePermissions } from '@/hooks/use-permissions';
import { xpForDrink } from '@/utils/xp-calculator';
import { scanDrink } from '@/lib/services/scan-service';
import { enrichDrink } from '@/lib/services/drink-enrichment';
import { logCorrection } from '@/lib/repositories/corrections-repository';
import { logDrink } from '@/lib/repositories/drink-repository';
import type { ScanResult } from '@/lib/services/scan-service';

const CURRENT_USER_ID = 'mock-user';

const VESSEL_OPTIONS = [
  'pint glass',
  'wine glass',
  'shot glass',
  'solo cup',
  'can',
  'bottle',
  'rocks glass',
  'highball glass',
  'martini glass',
  'champagne flute',
] as const;

type ScanState = 'idle' | 'barcode' | 'scanning' | 'identified' | 'error';

interface EditableFields {
  drinkType: string;
  abv: number;
  vesselType: string;
  fillLevel: number;
}

interface PhotoRecognitionProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function PhotoRecognition({ isOpen, onClose }: PhotoRecognitionProps) {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [editable, setEditable] = useState<EditableFields | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addDrink = useDrinkStore((s) => s.addDrink);
  const catalog = useDrinkStore((s) => s.catalog);
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
    fileInputRef.current?.click();
  }, [cameraPermission, requestCamera, addToast, haptic]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanState('scanning');

    try {
      const base64 = await fileToBase64(file);
      const result = await scanDrink(base64);
      setScanResult(result);
      setEditable({
        drinkType: result.drinkType,
        abv: parseFloat((result.abv * 100).toFixed(1)),
        vesselType: result.vesselType,
        fillLevel: Math.round(result.fillLevel * 100),
      });
      setScanState('identified');
      haptic.light();
    } catch {
      addToast({ message: 'Could not scan drink. Try again or add manually.', variant: 'error' });
      setScanState('error');
    }

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [addToast, haptic]);

  const handleAdd = useCallback(async () => {
    if (!scanResult || !editable) return;
    haptic.medium();

    const abvDecimal = editable.abv / 100;
    const fillDecimal = editable.fillLevel / 100;

    // Find a matching catalog item if possible
    const catalogMatch = catalog.find(
      (c) => c.name.toLowerCase() === editable.drinkType.toLowerCase(),
    );

    if (catalogMatch) {
      addDrink(catalogMatch.id);
    } else {
      // Log directly via repository for non-catalog drinks
      const alcoholMl = scanResult.volumeMl * fillDecimal * abvDecimal;
      const alcoholGrams = alcoholMl * 0.789;
      try {
        const entry = await logDrink(CURRENT_USER_ID, {
          catalogItemId: null,
          drinkType: editable.drinkType,
          alcoholGrams,
          abv: abvDecimal,
          volumeMl: scanResult.volumeMl,
          vesselType: editable.vesselType,
          fillLevel: fillDecimal,
          isManualEntry: false,
        });

        // If user edited any field, save a correction
        const userEdited =
          editable.drinkType !== scanResult.drinkType ||
          Math.abs(editable.abv - scanResult.abv * 100) > 0.01 ||
          editable.vesselType !== scanResult.vesselType ||
          Math.abs(editable.fillLevel - scanResult.fillLevel * 100) > 0.5;

        if (userEdited) {
          logCorrection(
            entry.id,
            {
              drink_type: scanResult.drinkType,
              abv: scanResult.abv,
              vessel_type: scanResult.vesselType,
              fill_level: scanResult.fillLevel,
            },
            {
              drink_type: editable.drinkType,
              abv: abvDecimal,
              vessel_type: editable.vesselType,
              fill_level: fillDecimal,
            },
          ).catch(() => {
            // Correction logging is best-effort
          });
        }
      } catch {
        // Supabase unavailable — drink not persisted but UX continues
      }
    }

    const xp = xpForDrink(currentUser.streakWeekends);
    awardXP(xp);
    addToast({ message: `+${xp} XP — ${editable.drinkType} added!`, variant: 'success' });
    onClose();
    setScanState('idle');
    setScanResult(null);
    setEditable(null);
  }, [
    scanResult,
    editable,
    haptic,
    catalog,
    addDrink,
    currentUser.streakWeekends,
    awardXP,
    addToast,
    onClose,
  ]);

  const handleManual = useCallback(() => {
    onClose();
    setScanState('idle');
    setScanResult(null);
    setEditable(null);
    setBarcodeInput('');
  }, [onClose]);

  const handleReset = useCallback(() => {
    setScanState('idle');
    setScanResult(null);
    setEditable(null);
    setBarcodeInput('');
  }, []);

  const handleBarcodeSubmit = useCallback(async () => {
    const code = barcodeInput.trim();
    if (!code) return;
    setBarcodeLoading(true);
    try {
      const enriched = await enrichDrink({ barcode: code });
      if (enriched) {
        const result: ScanResult = {
          drinkType: enriched.name,
          brand: enriched.brand,
          vesselType: 'can',
          fillLevel: 1.0,
          abv: enriched.abv,
          volumeMl: enriched.standard_volume_ml,
          standardDrinks: enriched.standard_drinks,
          confidence: 0.90,
          isMock: false,
          catalogId: enriched.id,
          enrichmentSource: enriched.source ?? 'openfoodfacts',
        };
        setScanResult(result);
        setEditable({
          drinkType: result.drinkType,
          abv: parseFloat((result.abv * 100).toFixed(1)),
          vesselType: result.vesselType,
          fillLevel: Math.round(result.fillLevel * 100),
        });
        setScanState('identified');
        haptic.light();
      } else {
        addToast({ message: 'Barcode not found. Try scanning the drink image instead.', variant: 'error' });
      }
    } catch {
      addToast({ message: 'Barcode lookup failed. Please try again.', variant: 'error' });
    } finally {
      setBarcodeLoading(false);
    }
  }, [barcodeInput, haptic, addToast]);

  const updateEditable = useCallback(<K extends keyof EditableFields>(
    field: K,
    value: EditableFields[K],
  ) => {
    setEditable((prev) => prev ? { ...prev, [field]: value } : prev);
  }, []);

  return (
    <SheetModal isOpen={isOpen} onClose={onClose} title="Scan Your Drink">
      {/* Hidden file input for camera/gallery capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

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
              <Button variant="ghost" size="default" fullWidth onClick={() => setScanState('barcode')}>
                <Barcode size={18} className="mr-2" />
                Enter Barcode
              </Button>
            </motion.div>
          )}

          {scanState === 'barcode' && (
            <motion.div
              key="barcode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6 w-full"
            >
              <div className="w-full aspect-square max-w-[280px] bg-surface rounded-2xl border-2 border-dashed border-border flex items-center justify-center">
                <Barcode size={64} className="text-text-secondary" />
              </div>
              <p className="text-text-secondary text-base text-center">
                Enter the barcode number from the packaging
              </p>
              <input
                type="text"
                inputMode="numeric"
                placeholder="e.g. 018200007315"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary text-base focus:outline-none focus:border-glow text-center tracking-widest"
              />
              <Button
                variant="primary"
                size="large"
                fullWidth
                onClick={handleBarcodeSubmit}
                disabled={!barcodeInput.trim() || barcodeLoading}
              >
                {barcodeLoading ? 'Looking up…' : 'Look Up Drink'}
              </Button>
              <Button variant="ghost" size="default" fullWidth onClick={handleReset}>
                Cancel
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

          {scanState === 'identified' && editable && (
            <motion.div
              key="identified"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-5 w-full"
            >
              <p className="text-text-secondary text-sm text-center">
                AI identified your drink. Edit any field before confirming.
              </p>

              {/* Drink name */}
              <div className="flex flex-col gap-1">
                <label className="text-text-secondary text-xs font-medium uppercase tracking-wide">
                  Drink Name
                </label>
                <input
                  type="text"
                  value={editable.drinkType}
                  onChange={(e) => updateEditable('drinkType', e.target.value)}
                  className="bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary text-base focus:outline-none focus:border-glow"
                />
              </div>

              {/* ABV */}
              <div className="flex flex-col gap-1">
                <label className="text-text-secondary text-xs font-medium uppercase tracking-wide">
                  ABV %
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={editable.abv}
                  onChange={(e) => updateEditable('abv', parseFloat(e.target.value) || 0)}
                  className="bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary text-base focus:outline-none focus:border-glow"
                />
              </div>

              {/* Vessel type */}
              <div className="flex flex-col gap-1">
                <label className="text-text-secondary text-xs font-medium uppercase tracking-wide">
                  Vessel Type
                </label>
                <select
                  value={editable.vesselType}
                  onChange={(e) => updateEditable('vesselType', e.target.value)}
                  className="bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary text-base focus:outline-none focus:border-glow appearance-none"
                >
                  {VESSEL_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fill level */}
              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-xs font-medium uppercase tracking-wide flex justify-between">
                  <span>Fill Level</span>
                  <span className="text-text-primary">{editable.fillLevel}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={editable.fillLevel}
                  onChange={(e) => updateEditable('fillLevel', parseInt(e.target.value, 10))}
                  className="w-full accent-glow"
                />
              </div>

              <Button variant="primary" size="large" fullWidth onClick={handleAdd}>
                <Plus size={20} className="mr-2" />
                Confirm Drink
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (data:image/jpeg;base64,...)
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Failed to read file as base64'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}
