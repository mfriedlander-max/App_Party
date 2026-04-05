export interface SocialPost {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string;
  likeCount: number;
  commentCount: number;
  postedAt: string;
  partyId?: string;
  /** Populated from Supabase profiles join */
  userName?: string;
  /** Supabase Storage URL for user avatar */
  userAvatar?: string;
}
