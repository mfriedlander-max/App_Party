export interface RecapSlide {
  id: string;
  variant: 'stat-reveal' | 'group-photo' | 'drink-breakdown' | 'peak-moment';
  heading: string;
  subheading: string;
  value?: string;
  backgroundGradient: string;
}

export interface Recap {
  id: string;
  partyId: string;
  date: string;
  slides: RecapSlide[];
}
