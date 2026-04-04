import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DrinkLogger } from '@/features/drinks/DrinkLogger';
import { useDrinkStore } from '@/store/drink-store';
import { useAppStore } from '@/store/app-store';
import type { DrinkStoreState, AppStoreState } from '@/types';

// Reset stores between tests
beforeEach(() => {
  useDrinkStore.setState((state: DrinkStoreState) => ({ ...state, log: [] }));
  useAppStore.setState((state: AppStoreState) => ({ ...state, toasts: [] }));
});

describe('DrinkLogger — category selection', () => {
  it('renders the four category tiles', () => {
    render(<DrinkLogger isOpen={true} onClose={() => undefined} />);
    expect(screen.getByText('Beer')).toBeDefined();
    expect(screen.getByText('Cocktail')).toBeDefined();
    expect(screen.getByText('Shot')).toBeDefined();
    expect(screen.getByText('Wine')).toBeDefined();
  });

  it('selecting a category shows drinks in that category', async () => {
    render(<DrinkLogger isOpen={true} onClose={() => undefined} />);
    fireEvent.click(screen.getByText('Beer'));
    // AnimatePresence renders both entering and exiting elements; waitFor until IPA appears
    await waitFor(() => {
      expect(screen.getByText('IPA')).toBeDefined();
    });
  });

  it('shows drinks only from the selected category', async () => {
    render(<DrinkLogger isOpen={true} onClose={() => undefined} />);
    fireEvent.click(screen.getByText('Shot'));
    await waitFor(() => {
      expect(screen.getByText('Tequila Shot')).toBeDefined();
    });
    // Beer items should not be in the DOM
    expect(screen.queryByText('IPA')).toBeNull();
  });
});

describe('DrinkLogger — drink selection and confirmation', () => {
  it('selecting a drink and confirming calls addDrink on the store', async () => {
    const addDrink = vi.spyOn(useDrinkStore.getState(), 'addDrink');
    render(<DrinkLogger isOpen={true} onClose={() => undefined} />);
    fireEvent.click(screen.getByText('Beer'));
    await waitFor(() => expect(screen.getByText('IPA')).toBeDefined());
    fireEvent.click(screen.getByText('IPA'));
    await waitFor(() => expect(screen.getByText('Add Drink')).toBeDefined());
    fireEvent.click(screen.getByText('Add Drink'));
    expect(addDrink).toHaveBeenCalledWith('beer-ipa');
  });

  it('calls onClose after confirming a drink', async () => {
    const onClose = vi.fn();
    render(<DrinkLogger isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Beer'));
    await waitFor(() => expect(screen.getByText('IPA')).toBeDefined());
    fireEvent.click(screen.getByText('IPA'));
    await waitFor(() => expect(screen.getByText('Add Drink')).toBeDefined());
    fireEvent.click(screen.getByText('Add Drink'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
