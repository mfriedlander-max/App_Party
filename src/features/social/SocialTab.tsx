import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SocialFeed } from './SocialFeed';
import { usePartyStore } from '@/store/party-store';
import { fetchSocialFeed } from '@/lib/repositories/social-repository';
import { CURRENT_USER } from '@/data/mock-users';
import type { SocialPost } from '@/types';
import type { SocialFeedItem } from '@/lib/repositories/media-repository';

function feedItemToPost(item: SocialFeedItem): SocialPost {
  return {
    id: item.id,
    userId: item.user_id,
    imageUrl: item.storage_url,
    caption: '',
    likeCount: 0,
    commentCount: 0,
    postedAt: item.captured_at,
    partyId: item.party_id ?? undefined,
    userName: item.user_name,
    userAvatar: item.user_avatar ?? undefined,
  };
}

export function SocialTab() {
  const mockFeed = usePartyStore((s) => s.socialFeed);
  const [posts, setPosts] = useState<SocialPost[]>(mockFeed);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchSocialFeed(CURRENT_USER.id);
      setPosts(items.length > 0 ? items.map(feedItemToPost) : mockFeed);
    } catch {
      // Supabase unavailable — fall back to mock data
      setPosts(mockFeed);
    } finally {
      setLoading(false);
    }
  }, [mockFeed]);

  useEffect(() => {
    loadFeed().catch(() => {});
  }, [loadFeed]);

  function handleRefresh() {
    loadFeed().catch(() => {});
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

      <SocialFeed posts={posts} loading={loading} />
    </div>
  );
}
