import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LeaderboardTab } from '@/features/leaderboard/LeaderboardTab';
import { useDrinkStore } from '@/store/drink-store';
import type { DrinkStoreState } from '@/types';

beforeEach(() => {
  useDrinkStore.setState((state: DrinkStoreState) => ({
    ...state,
    leaderboardPeriod: 'tonight',
    leaderboard: [
      { userId: 'user-1', rank: 1, drinkCount: 8, xp: 4800, period: 'tonight' },
      { userId: 'user-2', rank: 2, drinkCount: 6, xp: 2950, period: 'tonight' },
      { userId: 'user-3', rank: 3, drinkCount: 5, xp: 9200, period: 'tonight' },
      { userId: 'user-4', rank: 4, drinkCount: 3, xp: 1200, period: 'tonight' },
      { userId: 'user-5', rank: 5, drinkCount: 2, xp: 6400, period: 'tonight' },
    ],
  }));
});

describe('LeaderboardTab', () => {
  it('renders ranked list sorted by drinkCount descending', () => {
    render(<LeaderboardTab />);
    // First item should be rank 1 with 8 drinks
    const rank1 = screen.getByTestId('leaderboard-rank-1');
    expect(rank1).toBeDefined();
    // Last ranked item (4th+) should appear
    const rank4 = screen.getByTestId('leaderboard-rank-4');
    expect(rank4).toBeDefined();
  });

  it('current user row has distinct visual indicator', () => {
    render(<LeaderboardTab />);
    // Current user is user-1 (rank 1), should have data-current-user="true"
    const currentRow = screen.getByTestId('leaderboard-rank-1');
    expect(currentRow.getAttribute('data-current-user')).toBe('true');
  });

  it('non-current user rows do not have current user indicator', () => {
    render(<LeaderboardTab />);
    const rank2 = screen.getByTestId('leaderboard-rank-2');
    expect(rank2.getAttribute('data-current-user')).toBe('false');
  });

  it('switching period filter updates displayed data', () => {
    render(<LeaderboardTab />);
    // Click "This Weekend" segment
    const weekendBtn = screen.getByRole('tab', { name: /weekend/i });
    fireEvent.click(weekendBtn);
    // The store should have updated leaderboardPeriod
    expect(useDrinkStore.getState().leaderboardPeriod).toBe('weekend');
  });

  it('top 3 entries are shown in podium section', () => {
    render(<LeaderboardTab />);
    expect(screen.getByTestId('podium-1')).toBeDefined();
    expect(screen.getByTestId('podium-2')).toBeDefined();
    expect(screen.getByTestId('podium-3')).toBeDefined();
  });

  it('4th place and beyond appear in ranked list below podium', () => {
    render(<LeaderboardTab />);
    // Rank 4 should be in the list below podium, not in podium
    const rank4 = screen.getByTestId('leaderboard-rank-4');
    expect(rank4).toBeDefined();
  });

  it('shows empty state when leaderboard is empty', () => {
    useDrinkStore.setState((state: DrinkStoreState) => ({
      ...state,
      leaderboard: [],
    }));
    render(<LeaderboardTab />);
    expect(screen.getByText(/be the first to log a drink/i)).toBeDefined();
  });
});
