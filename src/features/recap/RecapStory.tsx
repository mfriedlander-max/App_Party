import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { RecapSlide } from './RecapSlide';
import { RecapShare } from './RecapShare';
import type { Recap } from '@/types';

const SLIDE_DURATION_MS = 5000;

interface RecapStoryProps {
  readonly recap: Recap;
  readonly onClose: () => void;
}

export function RecapStory({ recap, onClose }: RecapStoryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLastSlide = currentIndex === recap.slides.length - 1;

  const goNext = useCallback(() => {
    if (currentIndex < recap.slides.length - 1) {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    } else {
      onClose();
    }
  }, [currentIndex, recap.slides.length, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  // Auto-advance timer
  useEffect(() => {
    timerRef.current = setTimeout(goNext, SLIDE_DURATION_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, goNext]);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  const currentSlide = recap.slides[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" style={{ touchAction: 'none' }}>
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-3 pt-4">
        {recap.slides.map((slide, i) => (
          <div
            key={slide.id}
            data-testid="progress-bar-segment"
            className="flex-1 h-1 rounded-full overflow-hidden bg-white/30"
          >
            {i < currentIndex && (
              <div className="h-full w-full bg-white rounded-full" />
            )}
            {i === currentIndex && (
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: SLIDE_DURATION_MS / 1000, ease: 'linear' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-8 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/40"
        aria-label="Close recap"
      >
        <X size={20} className="text-white" />
      </button>

      {/* Slide content */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentSlide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-0"
          >
            <RecapSlide slide={currentSlide} />
          </motion.div>
        </AnimatePresence>

        {/* Tap zones */}
        <button
          data-testid="tap-left"
          onClick={goPrev}
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
          aria-label="Previous slide"
          style={{ background: 'transparent' }}
        />
        <button
          data-testid="tap-right"
          onClick={goNext}
          className="absolute right-0 top-0 bottom-0 w-2/3 z-10"
          aria-label="Next slide"
          style={{ background: 'transparent' }}
        />
      </div>

      {/* Share CTA on last slide */}
      {isLastSlide && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 28 }}
          className="p-6 pb-10 relative z-20"
        >
          <RecapShare recap={recap} />
        </motion.div>
      )}
    </div>
  );
}
