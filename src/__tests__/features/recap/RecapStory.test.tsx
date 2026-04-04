import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { RecapStory } from '@/features/recap/RecapStory';
import type { Recap } from '@/types';

const MOCK_RECAP: Recap = {
  id: 'recap-test',
  partyId: 'party-test',
  date: new Date().toISOString(),
  slides: [
    {
      id: 'slide-1',
      variant: 'stat-reveal',
      heading: 'Slide One',
      subheading: 'First slide',
      value: '42',
      backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      id: 'slide-2',
      variant: 'stat-reveal',
      heading: 'Slide Two',
      subheading: 'Second slide',
      value: '99',
      backgroundGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      id: 'slide-3',
      variant: 'peak-moment',
      heading: 'Slide Three',
      subheading: 'Third slide',
      backgroundGradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
  ],
};

describe('RecapStory — navigation', () => {
  it('renders the first slide heading on open', () => {
    render(<RecapStory recap={MOCK_RECAP} onClose={() => undefined} />);
    expect(screen.getByText('Slide One')).toBeDefined();
  });

  it('tapping right side advances to next slide', async () => {
    render(<RecapStory recap={MOCK_RECAP} onClose={() => undefined} />);
    const rightZone = screen.getByTestId('tap-right');
    fireEvent.click(rightZone);
    await waitFor(() => expect(screen.getByText('Slide Two')).toBeDefined());
  });

  it('tapping left side goes back to previous slide', () => {
    render(<RecapStory recap={MOCK_RECAP} onClose={() => undefined} />);
    const rightZone = screen.getByTestId('tap-right');
    fireEvent.click(rightZone); // advance to slide 2
    const leftZone = screen.getByTestId('tap-left');
    fireEvent.click(leftZone); // go back to slide 1
    expect(screen.getByText('Slide One')).toBeDefined();
  });

  it('progress bars count matches slide count', () => {
    render(<RecapStory recap={MOCK_RECAP} onClose={() => undefined} />);
    const progressBars = screen.getAllByTestId('progress-bar-segment');
    expect(progressBars.length).toBe(MOCK_RECAP.slides.length);
  });

  it('tapping left on the first slide does not go before slide 1', () => {
    render(<RecapStory recap={MOCK_RECAP} onClose={() => undefined} />);
    const leftZone = screen.getByTestId('tap-left');
    fireEvent.click(leftZone);
    // Still on first slide
    expect(screen.getByText('Slide One')).toBeDefined();
  });
});

describe('RecapStory — auto-advance', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('auto-advances to next slide after 5 seconds', async () => {
    render(<RecapStory recap={MOCK_RECAP} onClose={() => undefined} />);
    expect(screen.getByText('Slide One')).toBeDefined();

    // Fire the 5-second timeout that triggers goNext
    await act(async () => {
      vi.advanceTimersByTime(5001);
    });

    // After state update, Slide Two heading should be rendered
    // (AnimatePresence in jsdom renders new content immediately after state change)
    expect(screen.getByText('Slide Two')).toBeDefined();
  });

  it('calls onClose after auto-advancing past the last slide', async () => {
    const onClose = vi.fn();
    render(<RecapStory recap={MOCK_RECAP} onClose={onClose} />);
    await act(async () => {
      vi.advanceTimersByTime(5001); // slide 1 → 2
    });
    await act(async () => {
      vi.advanceTimersByTime(5001); // slide 2 → 3
    });
    await act(async () => {
      vi.advanceTimersByTime(5001); // slide 3 → done (onClose)
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
