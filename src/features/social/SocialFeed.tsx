import { motion } from 'framer-motion';
import { SocialPost } from './SocialPost';
import { EmptyState } from '@/design-system/components/EmptyState';
import { staggerContainer, staggerItem } from '@/design-system/animations';
import { MOCK_USERS } from '@/data/mock-users';
import type { SocialPost as SocialPostType } from '@/types';

interface SocialFeedProps {
  readonly posts: SocialPostType[];
  readonly loading?: boolean;
}

// Skeleton placeholder card
function SkeletonCard() {
  return (
    <div className="bg-surface-raised border-b border-border-subtle animate-pulse">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-full bg-border" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 rounded bg-border w-32" />
          <div className="h-3 rounded bg-border w-20" />
        </div>
      </div>
      <div className="w-full aspect-square bg-border" />
      <div className="px-4 py-3 space-y-2">
        <div className="h-3.5 rounded bg-border w-3/4" />
        <div className="h-3.5 rounded bg-border w-1/2" />
      </div>
    </div>
  );
}

function getUserForPost(userId: string) {
  const user = MOCK_USERS.find((u) => u.id === userId);
  return {
    name: user?.name ?? 'Unknown',
    seed: user?.name?.split(' ')[0] ?? userId,
  };
}

export function SocialFeed({ posts, loading = false }: SocialFeedProps) {
  if (loading) {
    return (
      <div>
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<span className="text-6xl">👥</span>}
        title="Nothing Here Yet"
        subtitle="Follow friends to see their posts"
      />
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {posts.map((post) => {
        const { name, seed } = getUserForPost(post.userId);
        return (
          <motion.div key={post.id} variants={staggerItem}>
            <SocialPost post={post} userName={name} userSeed={seed} />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
