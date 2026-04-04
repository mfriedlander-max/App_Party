import { describe, it, expect } from 'vitest';
import { formatBAC, formatXP, formatDrinkCount } from '@/utils/format';

describe('formatBAC', () => {
  it('formats to 2 decimal places', () => {
    expect(formatBAC(0.082)).toBe('0.08');
  });

  it('formats 0 as 0.00', () => {
    expect(formatBAC(0)).toBe('0.00');
  });

  it('formats a value that requires rounding', () => {
    // 0.156 rounds up to 0.16 in JS
    expect(formatBAC(0.156)).toBe('0.16');
  });
});

describe('formatXP', () => {
  it('formats 0 as "0"', () => {
    expect(formatXP(0)).toBe('0');
  });

  it('formats 999 without suffix', () => {
    expect(formatXP(999)).toBe('999');
  });

  it('formats 1500 as "1.5K"', () => {
    expect(formatXP(1500)).toBe('1.5K');
  });

  it('formats 1000000 as "1M"', () => {
    expect(formatXP(1_000_000)).toBe('1M');
  });

  it('formats 2500000 as "2.5M"', () => {
    expect(formatXP(2_500_000)).toBe('2.5M');
  });
});

describe('formatDrinkCount', () => {
  it('singular for 1 drink', () => {
    expect(formatDrinkCount(1)).toBe('1 drink');
  });

  it('plural for 7 drinks', () => {
    expect(formatDrinkCount(7)).toBe('7 drinks');
  });

  it('plural for 0 drinks', () => {
    expect(formatDrinkCount(0)).toBe('0 drinks');
  });

  it('plural for 2 drinks', () => {
    expect(formatDrinkCount(2)).toBe('2 drinks');
  });
});
