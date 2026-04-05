import { describe, it, expect, beforeEach } from 'vitest';
import {
  estimateAlcoholContent,
  getContainerVolumeSync,
  clearContainerCache,
} from '@/lib/services/container-service';

beforeEach(() => {
  clearContainerCache();
});

// ─── getContainerVolumeSync ───────────────────────────────────────────────────

describe('getContainerVolumeSync', () => {
  it('returns can volume for "can"', () => {
    const result = getContainerVolumeSync('can');
    expect(result.volumeMl).toBe(355);
    expect(result.typicalFill).toBe(1.0);
  });

  it('returns bottle volume for "bottle"', () => {
    const result = getContainerVolumeSync('bottle');
    expect(result.volumeMl).toBe(355);
    expect(result.typicalFill).toBe(1.0);
  });

  it('returns pint glass volume', () => {
    const result = getContainerVolumeSync('pint glass');
    expect(result.volumeMl).toBe(473);
    expect(result.typicalFill).toBe(0.90);
  });

  it('returns wine glass volume with 75% fill', () => {
    const result = getContainerVolumeSync('wine glass');
    expect(result.volumeMl).toBe(148);
    expect(result.typicalFill).toBe(0.75);
  });

  it('returns shot glass volume with full fill', () => {
    const result = getContainerVolumeSync('shot glass');
    expect(result.volumeMl).toBe(44);
    expect(result.typicalFill).toBe(1.00);
  });

  it('returns rocks glass volume', () => {
    const result = getContainerVolumeSync('rocks glass');
    expect(result.volumeMl).toBe(177);
  });

  it('returns highball glass volume', () => {
    const result = getContainerVolumeSync('highball glass');
    expect(result.volumeMl).toBe(355);
  });

  it('returns martini glass volume', () => {
    const result = getContainerVolumeSync('martini glass');
    expect(result.volumeMl).toBe(148);
  });

  it('returns champagne flute volume', () => {
    const result = getContainerVolumeSync('champagne flute');
    expect(result.volumeMl).toBe(148);
  });

  it('returns solo cup volume', () => {
    const result = getContainerVolumeSync('solo cup');
    expect(result.volumeMl).toBe(473);
  });

  it('returns default 355ml for unknown vessel', () => {
    const result = getContainerVolumeSync('mystery goblet');
    expect(result.volumeMl).toBe(355);
    expect(result.typicalFill).toBe(1.0);
  });

  it('is case-insensitive', () => {
    const lower = getContainerVolumeSync('pint glass');
    const upper = getContainerVolumeSync('PINT GLASS');
    expect(lower.volumeMl).toBe(upper.volumeMl);
  });

  it('matches partial vessel names', () => {
    const result = getContainerVolumeSync('large pint glass');
    expect(result.volumeMl).toBe(473);
  });
});

// ─── estimateAlcoholContent ──────────────────────────────────────────────────

describe('estimateAlcoholContent', () => {
  it('computes alcohol grams and standard drinks for a standard beer', () => {
    // 5% ABV, 355ml can, full
    // alcoholMl = 355 * 1.0 * 0.05 = 17.75
    // alcoholGrams = 17.75 * 0.789 = 14.00
    // standardDrinks = 14.00 / 14 = 1.0
    const result = estimateAlcoholContent(0.05, 355, 1.0);
    expect(result.alcoholGrams).toBeCloseTo(14.00, 1);
    expect(result.standardDrinks).toBeCloseTo(1.00, 1);
  });

  it('computes alcohol for a wine pour', () => {
    // 13% ABV, 150ml pour, full
    // alcoholMl = 150 * 1.0 * 0.13 = 19.5
    // alcoholGrams = 19.5 * 0.789 ≈ 15.39
    // standardDrinks ≈ 1.10
    const result = estimateAlcoholContent(0.13, 150, 1.0);
    expect(result.alcoholGrams).toBeCloseTo(15.39, 1);
    expect(result.standardDrinks).toBeCloseTo(1.10, 1);
  });

  it('computes alcohol for a shot', () => {
    // 40% ABV, 44ml, full
    // alcoholMl = 44 * 1.0 * 0.40 = 17.6
    // alcoholGrams = 17.6 * 0.789 ≈ 13.89
    // standardDrinks ≈ 0.99
    const result = estimateAlcoholContent(0.40, 44, 1.0);
    expect(result.alcoholGrams).toBeCloseTo(13.89, 1);
    expect(result.standardDrinks).toBeCloseTo(0.99, 1);
  });

  it('scales by fill level', () => {
    const full = estimateAlcoholContent(0.05, 355, 1.0);
    const half = estimateAlcoholContent(0.05, 355, 0.5);
    expect(half.alcoholGrams).toBeCloseTo(full.alcoholGrams / 2, 2);
    expect(half.standardDrinks).toBeCloseTo(full.standardDrinks / 2, 2);
  });

  it('returns zero for zero ABV', () => {
    const result = estimateAlcoholContent(0, 355, 1.0);
    expect(result.alcoholGrams).toBe(0);
    expect(result.standardDrinks).toBe(0);
  });

  it('returns zero for zero volume', () => {
    const result = estimateAlcoholContent(0.05, 0, 1.0);
    expect(result.alcoholGrams).toBe(0);
    expect(result.standardDrinks).toBe(0);
  });

  it('returns zero for zero fill level', () => {
    const result = estimateAlcoholContent(0.05, 355, 0);
    expect(result.alcoholGrams).toBe(0);
    expect(result.standardDrinks).toBe(0);
  });

  it('handles high ABV spirit (40% 44ml)', () => {
    const result = estimateAlcoholContent(0.40, 44, 1.0);
    expect(result.standardDrinks).toBeGreaterThan(0.9);
    expect(result.standardDrinks).toBeLessThan(1.1);
  });

  it('returns numeric values with 2 decimal places for standardDrinks', () => {
    const result = estimateAlcoholContent(0.05, 355, 1.0);
    const decimals = result.standardDrinks.toString().split('.')[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(2);
  });
});
