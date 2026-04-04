import { describe, it, expect } from 'vitest';
import { xpForDrink, levelThreshold, xpToLevel } from '@/utils/xp-calculator';

describe('xpForDrink', () => {
  it('returns positive XP for 0 streak weekends', () => {
    expect(xpForDrink(0)).toBeGreaterThan(0);
  });

  it('streak bonus is additive — more weekends = more XP', () => {
    expect(xpForDrink(3)).toBeGreaterThan(xpForDrink(0));
  });

  it('XP increases linearly with streak', () => {
    const base = xpForDrink(0);
    expect(xpForDrink(1)).toBe(base + 1);
    expect(xpForDrink(5)).toBe(base + 5);
  });
});

describe('levelThreshold', () => {
  it('level 0 threshold is 0', () => {
    expect(levelThreshold(0)).toBe(0);
  });

  it('thresholds are monotonically increasing', () => {
    for (let l = 1; l <= 20; l++) {
      expect(levelThreshold(l)).toBeGreaterThan(levelThreshold(l - 1));
    }
  });

  it('level 1 threshold is 100', () => {
    expect(levelThreshold(1)).toBe(100);
  });

  it('level 2 threshold is 400', () => {
    expect(levelThreshold(2)).toBe(400);
  });
});

describe('xpToLevel', () => {
  it('0 XP = level 0', () => {
    expect(xpToLevel(0)).toBe(0);
  });

  it('99 XP = level 0 (below first threshold)', () => {
    expect(xpToLevel(99)).toBe(0);
  });

  it('100 XP = level 1', () => {
    expect(xpToLevel(100)).toBe(1);
  });

  it('400 XP = level 2', () => {
    expect(xpToLevel(400)).toBe(2);
  });

  it('large XP returns correct high level', () => {
    // level 10 threshold = 10*10*100 = 10000
    expect(xpToLevel(10000)).toBe(10);
  });
});
