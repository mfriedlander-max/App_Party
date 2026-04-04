import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/app-store';
import type { AppStoreState } from '@/types';

// Reset store between tests
beforeEach(() => {
  useAppStore.setState((state: AppStoreState) => ({
    ...state,
    toasts: [],
    notifications: [],
  }));
});

describe('useAppStore — awardXP', () => {
  it('creates a new user object (referential inequality)', () => {
    const before = useAppStore.getState().currentUser;
    useAppStore.getState().awardXP(50);
    const after = useAppStore.getState().currentUser;
    expect(after).not.toBe(before);
  });

  it('increases currentUser xp by the given amount', () => {
    const before = useAppStore.getState().currentUser.xp;
    useAppStore.getState().awardXP(100);
    expect(useAppStore.getState().currentUser.xp).toBe(before + 100);
  });
});

describe('useAppStore — toasts', () => {
  it('addToast adds an entry with a generated id', () => {
    useAppStore.getState().addToast({ message: 'Cheers!', variant: 'success' });
    const toasts = useAppStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Cheers!');
    expect(typeof toasts[0].id).toBe('string');
  });

  it('dismissToast removes the entry by id', () => {
    useAppStore.getState().addToast({ message: 'Hello', variant: 'info' });
    const id = useAppStore.getState().toasts[0].id;
    useAppStore.getState().dismissToast(id);
    expect(useAppStore.getState().toasts).toHaveLength(0);
  });

  it('dismissToast only removes matching id', () => {
    useAppStore.getState().addToast({ message: 'A', variant: 'info' });
    useAppStore.getState().addToast({ message: 'B', variant: 'warning' });
    const idA = useAppStore.getState().toasts[0].id;
    useAppStore.getState().dismissToast(idA);
    const remaining = useAppStore.getState().toasts;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].message).toBe('B');
  });
});

describe('useAppStore — safety alerts', () => {
  it('addSafetyAlert adds an entry with generated id and timestamp', () => {
    useAppStore.getState().addSafetyAlert({ level: 'warning', message: 'Slow down', acknowledged: false });
    const alerts = useAppStore.getState().notifications;
    expect(alerts).toHaveLength(1);
    expect(alerts[0].level).toBe('warning');
    expect(typeof alerts[0].id).toBe('string');
    expect(typeof alerts[0].triggeredAt).toBe('string');
  });

  it('acknowledgeSafetyAlert sets acknowledged to true', () => {
    useAppStore.getState().addSafetyAlert({ level: 'danger', message: 'Stop now', acknowledged: false });
    const id = useAppStore.getState().notifications[0].id;
    useAppStore.getState().acknowledgeSafetyAlert(id);
    expect(useAppStore.getState().notifications[0].acknowledged).toBe(true);
  });
});
