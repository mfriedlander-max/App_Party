import type { SocialPost } from '@/types';

const now = Date.now();
const MIN = 60 * 1000;
const HOUR = 60 * MIN;

export const MOCK_SOCIAL_FEED: SocialPost[] = [
  {
    id: 'post-1',
    userId: 'user-3',
    imageUrl: 'https://images.unsplash.com/photo-1575444758702-4a6b9222336e?w=400',
    caption: 'Rooftop views and good vibes 🌆 Aperol season is officially back.',
    likeCount: 24,
    commentCount: 5,
    postedAt: new Date(now - 30 * MIN).toISOString(),
    partyId: 'party-1',
  },
  {
    id: 'post-2',
    userId: 'user-2',
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400',
    caption: 'Mojito weather. Someone had to do it 🍃',
    likeCount: 17,
    commentCount: 3,
    postedAt: new Date(now - 1 * HOUR).toISOString(),
    partyId: 'party-1',
  },
  {
    id: 'post-3',
    userId: 'user-5',
    imageUrl: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400',
    caption: 'Old Fashioned appreciation post. Declan approved.',
    likeCount: 31,
    commentCount: 8,
    postedAt: new Date(now - 2 * HOUR).toISOString(),
    partyId: 'party-1',
  },
  {
    id: 'post-4',
    userId: 'user-8',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400',
    caption: 'Last weekend was unreal. Miss you all already 💜',
    likeCount: 42,
    commentCount: 12,
    postedAt: new Date(now - 6 * 24 * HOUR).toISOString(),
    partyId: 'party-2',
  },
  {
    id: 'post-5',
    userId: 'user-1',
    imageUrl: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=400',
    caption: 'Streak 8 weekends strong 🔥 Who is coming to the beach bonfire?',
    likeCount: 19,
    commentCount: 7,
    postedAt: new Date(now - 3 * HOUR).toISOString(),
  },
];
