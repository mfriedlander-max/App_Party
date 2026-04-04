export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlockedAt?: string;
}

export interface Streak {
  weekendsActive: number;
  currentMultiplier: number;
  lastActiveWeekend: string;
}
