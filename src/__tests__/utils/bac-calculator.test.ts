import { describe, it, expect } from 'vitest';
import { calculateBAC } from '@/utils/bac-calculator';

describe('calculateBAC', () => {
  it('returns 0.00 for 0 standard drinks', () => {
    expect(calculateBAC({ standardDrinks: 0, weightKg: 70, biologicalSex: 'male', hoursElapsed: 1 })).toBe(0);
  });

  it('approximates ~0.048 for 3 standard drinks / 70kg male / 1hr', () => {
    const result = calculateBAC({ standardDrinks: 3, weightKg: 70, biologicalSex: 'male', hoursElapsed: 1 });
    expect(result).toBeCloseTo(0.048, 2);
  });

  it('returns 0 for 0 weight (edge case)', () => {
    expect(calculateBAC({ standardDrinks: 5, weightKg: 0, biologicalSex: 'male', hoursElapsed: 1 })).toBe(0);
  });

  it('clamps negative result to 0 when hoursElapsed is very large', () => {
    const result = calculateBAC({ standardDrinks: 1, weightKg: 70, biologicalSex: 'male', hoursElapsed: 100 });
    expect(result).toBe(0);
  });

  it('uses female gender constant (lower BAC for same params)', () => {
    const male = calculateBAC({ standardDrinks: 3, weightKg: 60, biologicalSex: 'male', hoursElapsed: 0 });
    const female = calculateBAC({ standardDrinks: 3, weightKg: 60, biologicalSex: 'female', hoursElapsed: 0 });
    expect(female).toBeGreaterThan(male);
  });

  it('negative hoursElapsed is clamped to 0 elapsed (no metabolism subtracted)', () => {
    const zeroHours = calculateBAC({ standardDrinks: 2, weightKg: 70, biologicalSex: 'male', hoursElapsed: 0 });
    const negativeHours = calculateBAC({ standardDrinks: 2, weightKg: 70, biologicalSex: 'male', hoursElapsed: -5 });
    expect(negativeHours).toBe(zeroHours);
  });
});
