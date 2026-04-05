export interface RecapSlide {
  id: string;
  variant: 'stat-reveal' | 'group-photo' | 'drink-breakdown' | 'peak-moment';
  heading: string;
  subheading: string;
  value?: string;
  backgroundGradient: string;
  /** Real drink category data for drink-breakdown variant */
  drinkData?: Array<{ label: string; pct: number; color: string }>;
  /** Real member stats for group-photo variant */
  memberStats?: Array<{ userId: string; name: string; drinkCount: number }>;
  /** Media URLs for group-photo variant */
  mediaUrls?: string[];
}

export interface Recap {
  id: string;
  partyId: string;
  date: string;
  slides: RecapSlide[];
}
