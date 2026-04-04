import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BACMeter } from '@/features/drinks/BACMeter';
import { useDrinkStore } from '@/store/drink-store';
import { useAppStore } from '@/store/app-store';
import type { DrinkStoreState, AppStoreState } from '@/types';

beforeEach(() => {
  useDrinkStore.setState((state: DrinkStoreState) => ({ ...state, log: [] }));
  useAppStore.setState((state: AppStoreState) => ({
    ...state,
    currentUser: { ...state.currentUser, weightKg: 78, biologicalSex: 'male' },
  }));
});

describe('BACMeter', () => {
  it('renders "0.00" when drink log is empty', () => {
    render(<BACMeter />);
    expect(screen.getByText('0.00')).toBeDefined();
  });

  it('has aria-label announcing the BAC value', () => {
    render(<BACMeter />);
    const el = screen.getByRole('meter');
    expect(el.getAttribute('aria-label')).toContain('0.00');
  });

  it('shows green color class when BAC is below 0.06', () => {
    render(<BACMeter bac={0.03} />);
    const meter = screen.getByRole('meter');
    // The meter element should have a data attribute or class reflecting safe status
    expect(meter.getAttribute('data-bac-level')).toBe('safe');
  });

  it('shows yellow color class when BAC is between 0.06 and 0.079', () => {
    render(<BACMeter bac={0.07} />);
    const meter = screen.getByRole('meter');
    expect(meter.getAttribute('data-bac-level')).toBe('warning');
  });

  it('shows red color class when BAC is 0.08 or above', () => {
    render(<BACMeter bac={0.09} />);
    const meter = screen.getByRole('meter');
    expect(meter.getAttribute('data-bac-level')).toBe('danger');
  });
});
