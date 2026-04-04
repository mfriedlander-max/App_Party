export interface SocialPost {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string;
  likeCount: number;
  commentCount: number;
  postedAt: string;
  partyId?: string;
}
