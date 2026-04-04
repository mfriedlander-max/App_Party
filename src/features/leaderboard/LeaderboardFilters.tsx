import { SegmentedControl } from '@/design-system/components/SegmentedControl';
import { useDrinkStore } from '@/store/drink-store';
import type { DrinkStoreState } from '@/types';

const SEGMENTS = [
  { value: 'tonight', label: 'Tonight' },
  { value: 'weekend', label: 'Weekend' },
  { value: 'alltime', label: 'All Time' },
] as const;

export function LeaderboardFilters() {
  const period = useDrinkStore((s) => s.leaderboardPeriod);
  const setLeaderboardPeriod = useDrinkStore((s) => s.setLeaderboardPeriod);

  return (
    <SegmentedControl
      segments={SEGMENTS}
      value={period}
      onChange={(v) => setLeaderboardPeriod(v as DrinkStoreState['leaderboardPeriod'])}
    />
  );
}
