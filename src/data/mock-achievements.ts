import type { Badge } from '@/types';

export const ALL_BADGES: Badge[] = [
  { id: 'badge-first-sip', name: 'First Sip', description: 'Logged your very first drink', emoji: '🍺' },
  { id: 'badge-party-starter', name: 'Party Starter', description: 'Created your first party', emoji: '🎉' },
  { id: 'badge-social-butterfly', name: 'Social Butterfly', description: 'Joined 5 different parties', emoji: '🦋' },
  { id: 'badge-hydration-hero', name: 'Hydration Hero', description: 'Logged a water between every drink', emoji: '💧' },
  { id: 'badge-early-bird', name: 'Early Bird', description: 'Started drinking before 6pm', emoji: '🐦' },
  { id: 'badge-night-owl', name: 'Night Owl', description: 'Still going at 2am', emoji: '🦉' },
  { id: 'badge-shot-caller', name: 'Shot Caller', description: 'Logged 5 shots in one night', emoji: '🥃' },
  { id: 'badge-wine-connoisseur', name: 'Wine Connoisseur', description: 'Tried 4 different wines', emoji: '🍷' },
  { id: 'badge-beer-explorer', name: 'Beer Explorer', description: 'Tried 5 different beers', emoji: '🍻' },
  { id: 'badge-cocktail-king', name: 'Cocktail King', description: 'Ordered 3 different cocktails', emoji: '🍹' },
  { id: 'badge-streak-3', name: 'Hat Trick', description: '3 weekends in a row', emoji: '🎩' },
  { id: 'badge-streak-5', name: 'On Fire', description: '5 weekends in a row', emoji: '🔥' },
  { id: 'badge-streak-10', name: 'Decade Dancer', description: '10 weekends straight', emoji: '💃' },
  { id: 'badge-top-3', name: 'Podium', description: 'Finished top 3 on the leaderboard', emoji: '🏆' },
  { id: 'badge-champion', name: 'Champion', description: 'Finished #1 on the leaderboard', emoji: '👑' },
  { id: 'badge-pace-keeper', name: 'Pace Keeper', description: 'Stayed under 0.08 BAC all night', emoji: '🛡️' },
];

export const XP_LEVEL_TABLE: Record<number, number> = {
  0: 0,
  1: 100,
  2: 400,
  3: 900,
  4: 1600,
  5: 2500,
  6: 3600,
  7: 4900,
  8: 6400,
  9: 8100,
  10: 10000,
  11: 12100,
  12: 14400,
  13: 16900,
  14: 19600,
  15: 22500,
  16: 25600,
  17: 28900,
  18: 32400,
  19: 36100,
  20: 40000,
};

export const STREAK_MILESTONES: Array<{ weekends: number; reward: string; bonus: number }> = [
  { weekends: 2, reward: 'Double XP weekend', bonus: 2 },
  { weekends: 5, reward: 'Unlock "On Fire" badge', bonus: 5 },
  { weekends: 10, reward: 'Unlock "Decade Dancer" badge', bonus: 10 },
  { weekends: 20, reward: 'Legendary status', bonus: 20 },
];
