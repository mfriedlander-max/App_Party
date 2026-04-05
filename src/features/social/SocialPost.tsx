import { useState } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar } from '@/design-system/components/Avatar';
import { ShareSheet } from './ShareSheet';
import { formatTime } from '@/utils/format';
import type { SocialPost as SocialPostType } from '@/types';

interface SocialPostProps {
  readonly post: SocialPostType;
  readonly userName: string;
  readonly userSeed: string;
  readonly userAvatarUrl?: string;
}

export function SocialPost({ post, userName, userSeed, userAvatarUrl }: SocialPostProps) {
  // Immutable like state — never mutate post prop
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [shareOpen, setShareOpen] = useState(false);

  function handleLike() {
    if (liked) {
      setLiked(false);
      setLikeCount((c) => c - 1);
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
  }

  return (
    <>
      <article className="bg-surface-raised border-b border-border-subtle">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3">
          {userAvatarUrl ? (
            <img
              src={userAvatarUrl}
              alt={userName}
              className="w-8 h-8 rounded-full object-cover border-2 border-border-subtle"
            />
          ) : (
            <Avatar seed={userSeed} size="sm" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-text-primary font-semibold text-base leading-tight truncate">
              {userName}
            </p>
            <p className="text-text-muted text-sm">
              {formatTime(post.postedAt)}
            </p>
          </div>
        </div>

        {/* Image */}
        <div className="w-full aspect-square bg-surface-elevated overflow-hidden">
          <img
            src={post.imageUrl}
            alt={post.caption || `Photo by ${userName}`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 px-4 py-3">
          <motion.button
            data-testid="like-button"
            onClick={handleLike}
            whileTap={{ scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="flex items-center gap-1.5 min-w-[60px] min-h-[44px]"
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <Heart
              size={22}
              className="transition-colors duration-150"
              fill={liked ? '#FF2D55' : 'none'}
              color={liked ? '#FF2D55' : '#9090A0'}
            />
            <span
              className="text-base font-semibold transition-colors duration-150"
              style={{ color: liked ? '#FF2D55' : '#9090A0' }}
            >
              {likeCount}
            </span>
          </motion.button>

          <button
            className="flex items-center gap-1.5 min-h-[44px]"
            aria-label="Comments"
          >
            <MessageCircle size={22} color="#9090A0" />
            <span className="text-base font-semibold text-text-secondary">
              {post.commentCount}
            </span>
          </button>

          <button
            onClick={() => setShareOpen(true)}
            className="ml-auto flex items-center min-h-[44px] min-w-[44px] justify-end"
            aria-label="Share"
          >
            <Share2 size={22} color="#9090A0" />
          </button>
        </div>

        {/* Caption */}
        {post.caption ? (
          <div className="px-4 pb-4">
            <p className="text-text-primary text-base leading-snug">
              <span className="font-bold">{userName}</span>{' '}
              {post.caption}
            </p>
          </div>
        ) : null}
      </article>

      <ShareSheet isOpen={shareOpen} onClose={() => setShareOpen(false)} />
    </>
  );
}
