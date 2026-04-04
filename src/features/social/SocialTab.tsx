import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { SocialFeed } from './SocialFeed';
import { usePartyStore } from '@/store/party-store';

export function SocialTab() {
  const socialFeed = usePartyStore((s) => s.socialFeed);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  function handleRefresh() {
    setLoading(true);
    // Mock refresh — reset scroll and clear loading after a short delay
    setTimeout(() => {
      setLoading(false);
    }, 800);
  }

  return (
    <div className="relative" ref={scrollRef}>
      {/* Pull-to-refresh indicator */}
      {loading && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex items-center justify-center py-4"
        >
          <motion.div
            className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
          />
        </motion.div>
      )}

      {/* Refresh button */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-2xl font-black text-text-primary">Feed</h2>
        <button
          onClick={handleRefresh}
          className="text-base font-semibold text-[#FF2D55] min-h-[60px] px-4"
        >
          Refresh
        </button>
      </div>

      <SocialFeed posts={socialFeed} loading={loading} />
    </div>
  );
}
