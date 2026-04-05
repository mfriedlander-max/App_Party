import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Film, Calendar, Image, RefreshCw } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Card } from '@/design-system/components/Card';
import { EmptyState } from '@/design-system/components/EmptyState';
import { Button } from '@/design-system/components/Button';
import { RecapStory } from './RecapStory';
import { CameraRollSync } from '@/features/settings/CameraRollSync';
import { usePartyStore } from '@/store/party-store';
import { useAppStore } from '@/store/app-store';
import { usePermissions } from '@/hooks/use-permissions';
import { staggerContainer, staggerItem } from '@/design-system/animations';
import { MOCK_RECAPS } from '@/data/mock-recaps';
import { CURRENT_USER } from '@/data/mock-users';
import * as recapRepo from '@/lib/repositories/recap-repository';
import type { Recap } from '@/types';

function formatRecapDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

interface RecapCardProps {
  readonly recap: Recap;
  readonly onOpen: (recap: Recap) => void;
}

function RecapCard({ recap, onOpen }: RecapCardProps) {
  const firstSlide = recap.slides[0];
  const slideCount = recap.slides.length;

  return (
    <motion.div variants={staggerItem}>
      <Card padding={false} onClick={() => onOpen(recap)} glow="none">
        {/* Gradient header */}
        <div
          className="w-full rounded-t-xl flex items-end p-4"
          style={{
            background: firstSlide?.backgroundGradient ?? 'linear-gradient(135deg,#667eea,#764ba2)',
            minHeight: 100,
          }}
        >
          <div className="flex flex-col gap-0.5">
            <h3 className="text-white text-lg font-black leading-tight drop-shadow">
              {firstSlide?.heading ?? 'Party Recap'}
            </h3>
            <p className="text-white/70 text-sm font-medium">
              {firstSlide?.subheading ?? ''}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-text-secondary">
            <Calendar size={14} />
            <span className="text-sm font-medium">{formatRecapDate(recap.date)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Film size={14} />
            <span className="text-sm font-medium">{slideCount} slides</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function RecapTab() {
  const storeRecaps = usePartyStore((s) => s.recaps);
  const pastParties = usePartyStore((s) => s.pastParties);
  const addToast = useAppStore((s) => s.addToast);

  const [recaps, setRecaps] = useState<Recap[]>(storeRecaps);
  const [activeRecap, setActiveRecap] = useState<Recap | null>(null);
  const [showCameraRollSync, setShowCameraRollSync] = useState(false);
  const [generating, setGenerating] = useState(false);

  const photosPermission = usePermissions((s) => s.photos);
  const requestPhotos = usePermissions((s) => s.requestPhotos);

  const loadRecaps = useCallback(async () => {
    try {
      const fetched = await recapRepo.fetchRecapsForUser(CURRENT_USER.id);
      setRecaps(fetched.length > 0 ? fetched : MOCK_RECAPS);
    } catch {
      // Supabase unavailable — fall back to mock recaps
      setRecaps(MOCK_RECAPS);
    }
  }, []);

  useEffect(() => {
    loadRecaps().catch(() => {});
  }, [loadRecaps]);

  async function handleEnablePhotos() {
    await requestPhotos();
    setShowCameraRollSync(true);
  }

  async function handleGenerateRecap() {
    const mostRecentEnded = pastParties[0];
    if (!mostRecentEnded) {
      addToast({ message: 'No ended parties to generate a recap for', variant: 'info' });
      return;
    }

    setGenerating(true);
    try {
      const recap = await recapRepo.generateRecapLocally(mostRecentEnded.id);
      setRecaps((prev) => [recap, ...prev.filter((r) => r.partyId !== recap.partyId)]);
      addToast({ message: 'Recap generated!', variant: 'success' });
    } catch {
      addToast({ message: 'Could not generate recap — try again', variant: 'error' });
    } finally {
      setGenerating(false);
    }
  }

  if (recaps.length === 0) {
    return (
      <EmptyState
        icon={<span className="text-6xl">🎉</span>}
        title="No Recaps Yet"
        subtitle="Party tonight to unlock your recap!"
      />
    );
  }

  return (
    <>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-4"
      >
        <div className="flex items-center justify-between px-1">
          <h2 className="text-2xl font-black text-text-primary">Your Nights</h2>
          {pastParties.length > 0 && (
            <Button
              variant="ghost"
              onClick={handleGenerateRecap}
              disabled={generating}
            >
              <RefreshCw size={14} className={`mr-1.5 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating…' : 'Generate Recap'}
            </Button>
          )}
        </div>

        {/* Camera roll sync banner */}
        {photosPermission === 'granted' ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[rgba(52,199,89,0.12)] border border-[rgba(52,199,89,0.3)]"
          >
            <Image size={18} className="text-[#34C759] flex-shrink-0" />
            <p className="text-[#34C759] text-sm font-semibold flex-1">
              Camera roll synced — your photos will appear in recaps
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-border"
          >
            <Image size={18} className="text-text-secondary flex-shrink-0" />
            <p className="text-text-secondary text-sm font-medium flex-1">
              Sync your camera roll for better recaps
            </p>
            <button
              type="button"
              onClick={handleEnablePhotos}
              className="text-[#FF2D55] text-sm font-semibold flex-shrink-0 min-h-[44px] px-2 flex items-center"
            >
              Enable
            </button>
          </motion.div>
        )}

        {recaps.map((recap) => (
          <RecapCard key={recap.id} recap={recap} onOpen={setActiveRecap} />
        ))}
      </motion.div>

      <AnimatePresence>
        {activeRecap && (
          <RecapStory
            recap={activeRecap}
            onClose={() => setActiveRecap(null)}
          />
        )}
      </AnimatePresence>

      <CameraRollSync
        isOpen={showCameraRollSync}
        onClose={() => setShowCameraRollSync(false)}
      />
    </>
  );
}
