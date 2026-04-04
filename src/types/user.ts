import type { Badge } from './engagement';

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  xp: number;
  level: number;
  streakWeekends: number;
  badges: Badge[];
  weightKg: number;
  heightCm: number;
  biologicalSex: 'male' | 'female';
}
