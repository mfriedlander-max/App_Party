export interface LeaderboardEntry {
  userId: string;
  rank: number;
  drinkCount: number;
  xp: number;
  period: 'tonight' | 'weekend' | 'alltime';
}
