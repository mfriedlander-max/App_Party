import { useState } from 'react';
import { SheetModal } from '@/design-system/components/SheetModal';
import { Button } from '@/design-system/components/Button';
import { SegmentedControl } from '@/design-system/components/SegmentedControl';
import { useAppStore } from '@/store/app-store';
import { PermissionsCard } from './PermissionsCard';

const SEX_SEGMENTS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
] as const;

const WEIGHT_UNIT_SEGMENTS = [
  { value: 'kg', label: 'kg' },
  { value: 'lbs', label: 'lbs' },
] as const;

const HEIGHT_UNIT_SEGMENTS = [
  { value: 'cm', label: 'cm' },
  { value: 'ft', label: 'ft / in' },
] as const;

function kgToLbs(kg: number): number { return Math.round(kg * 2.20462); }
function lbsToKg(lbs: number): number { return Math.round(lbs / 2.20462); }
function cmToFtIn(cm: number): { ft: number; inches: number } {
  const totalInches = Math.round(cm / 2.54);
  return { ft: Math.floor(totalInches / 12), inches: totalInches % 12 };
}
function ftInToCm(ft: number, inches: number): number {
  return Math.round((ft * 12 + inches) * 2.54);
}

interface SettingsSheetProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function SettingsSheet({ isOpen, onClose }: SettingsSheetProps) {
  const currentUser = useAppStore((s) => s.currentUser);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const addToast = useAppStore((s) => s.addToast);

  const [name, setName] = useState(currentUser.name);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl);
  const [weightKg, setWeightKg] = useState(currentUser.weightKg);
  const [heightCm, setHeightCm] = useState(currentUser.heightCm);
  const [biologicalSex, setBiologicalSex] = useState<'male' | 'female'>(
    currentUser.biologicalSex,
  );
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('lbs');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('ft');
  const [ftValue, setFtValue] = useState(() => cmToFtIn(currentUser.heightCm).ft);
  const [inValue, setInValue] = useState(() => cmToFtIn(currentUser.heightCm).inches);

  function handlePhotoSelect() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          setAvatarUrl(dataUrl);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  function handleWeightChange(value: string): void {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    if (weightUnit === 'kg') {
      setWeightKg(Math.max(20, Math.min(300, num)));
    } else {
      setWeightKg(lbsToKg(Math.max(44, Math.min(660, num))));
    }
  }

  function handleHeightCmChange(value: string): void {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    const clamped = Math.max(100, Math.min(250, num));
    setHeightCm(clamped);
    const { ft, inches } = cmToFtIn(clamped);
    setFtValue(ft);
    setInValue(inches);
  }

  function handleFtChange(value: string): void {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    const clamped = Math.max(3, Math.min(8, num));
    setFtValue(clamped);
    setHeightCm(ftInToCm(clamped, inValue));
  }

  function handleInChange(value: string): void {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    const clamped = Math.max(0, Math.min(11, num));
    setInValue(clamped);
    setHeightCm(ftInToCm(ftValue, clamped));
  }

  function handleSave(): void {
    const trimmedName = name.trim();
    updateProfile({
      name: trimmedName || currentUser.name,
      avatarUrl,
      weightKg,
      heightCm,
      biologicalSex,
    });
    addToast({ message: 'Profile updated!', variant: 'success' });
    onClose();
  }

  return (
    <SheetModal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6 pb-4">

        {/* Profile Photo */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handlePhotoSelect}
            className="relative group cursor-pointer"
          >
            <img
              src={avatarUrl}
              alt="Profile photo"
              width={96}
              height={96}
              className="rounded-full border-2 border-border bg-surface-raised object-cover"
            />
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-sm font-semibold">Change</span>
            </div>
          </button>
          <button
            type="button"
            onClick={handlePhotoSelect}
            className="text-accent text-base font-semibold cursor-pointer"
          >
            Choose Photo
          </button>
        </div>

        {/* Name */}
        <div>
          <label
            htmlFor="display-name"
            className="block text-sm font-semibold text-text-secondary mb-1"
          >
            Display name
          </label>
          <input
            id="display-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full min-h-[60px] px-4 rounded-xl text-base font-medium text-text-primary bg-surface-raised border border-border focus:outline-none focus:border-[#FF2D55] transition-colors"
          />
        </div>

        {/* Weight */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-text-secondary">Weight</span>
            <SegmentedControl
              segments={WEIGHT_UNIT_SEGMENTS}
              value={weightUnit}
              onChange={(v) => setWeightUnit(v as 'kg' | 'lbs')}
            />
          </div>
          <div
            className="flex items-center gap-2 rounded-xl border border-border bg-surface-raised px-4"
            style={{ minHeight: 60 }}
          >
            <input
              type="number"
              inputMode="numeric"
              value={weightUnit === 'kg' ? weightKg : kgToLbs(weightKg)}
              onChange={(e) => handleWeightChange(e.target.value)}
              className="flex-1 bg-transparent text-xl font-black text-text-primary tabular-nums outline-none min-h-[60px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-base font-semibold text-text-muted">{weightUnit}</span>
          </div>
        </div>

        {/* Height */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-text-secondary">Height</span>
            <SegmentedControl
              segments={HEIGHT_UNIT_SEGMENTS}
              value={heightUnit}
              onChange={(v) => {
                setHeightUnit(v as 'cm' | 'ft');
                if (v === 'ft') {
                  const { ft, inches } = cmToFtIn(heightCm);
                  setFtValue(ft);
                  setInValue(inches);
                }
              }}
            />
          </div>
          {heightUnit === 'cm' ? (
            <div
              className="flex items-center gap-2 rounded-xl border border-border bg-surface-raised px-4"
              style={{ minHeight: 60 }}
            >
              <input
                type="number"
                inputMode="numeric"
                value={heightCm}
                onChange={(e) => handleHeightCmChange(e.target.value)}
                className="flex-1 bg-transparent text-xl font-black text-text-primary tabular-nums outline-none min-h-[60px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="text-base font-semibold text-text-muted">cm</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div
                className="flex-1 flex items-center gap-2 rounded-xl border border-border bg-surface-raised px-4"
                style={{ minHeight: 60 }}
              >
                <input
                  type="number"
                  inputMode="numeric"
                  value={ftValue}
                  onChange={(e) => handleFtChange(e.target.value)}
                  className="flex-1 bg-transparent text-xl font-black text-text-primary tabular-nums outline-none min-h-[60px] w-12 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="text-base font-semibold text-text-muted">ft</span>
              </div>
              <div
                className="flex-1 flex items-center gap-2 rounded-xl border border-border bg-surface-raised px-4"
                style={{ minHeight: 60 }}
              >
                <input
                  type="number"
                  inputMode="numeric"
                  value={inValue}
                  onChange={(e) => handleInChange(e.target.value)}
                  className="flex-1 bg-transparent text-xl font-black text-text-primary tabular-nums outline-none min-h-[60px] w-12 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="text-base font-semibold text-text-muted">in</span>
              </div>
            </div>
          )}
        </div>

        {/* Biological sex */}
        <div>
          <span className="block text-sm font-semibold text-text-secondary mb-1">
            Biological sex
          </span>
          <SegmentedControl
            segments={SEX_SEGMENTS}
            value={biologicalSex}
            onChange={(v) => setBiologicalSex(v as 'male' | 'female')}
          />
        </div>

        {/* Permissions */}
        <PermissionsCard />

        {/* Save */}
        <Button variant="primary" size="large" fullWidth onClick={handleSave}>
          Save
        </Button>
      </div>
    </SheetModal>
  );
}
