import { describe, it, expect } from 'vitest';
import { computeBAC } from '@/lib/bac';
import { BAC_TEST_VECTORS } from '@/lib/__fixtures__/bac-test-vectors';

describe('computeBAC — test vectors', () => {
  for (const vector of BAC_TEST_VECTORS) {
    it(vector.description, () => {
      const result = computeBAC(vector.logs as Parameters<typeof computeBAC>[0], vector.profile);
      expect(result).toBeCloseTo(vector.expectedBAC, 1);
    });
  }
});

describe('computeBAC — edge cases', () => {
  it('returns 0 when weightKg is 0', () => {
    expect(computeBAC([], { weightKg: 0, biologicalSex: 'male' })).toBe(0);
  });

  it('clamps result to 0 when all drinks have metabolized', () => {
    const { makeLog } = (() => {
      function makeLog(alcoholGrams: number, loggedAt: string) {
        return {
          id: 'test',
          user_id: 'user',
          party_id: null,
          catalog_item_id: null,
          drink_type: 'manual',
          estimated_alcohol_grams: alcoholGrams,
          abv: null,
          volume_ml: null,
          vessel_type: null,
          fill_level: 1.0,
          image_url: null,
          is_manual_entry: true,
          ai_raw_response: null,
          user_corrections: null,
          logged_at: loggedAt,
        };
      }
      return { makeLog };
    })();

    // 1 standard drink, 70kg male, 100 hours ago — fully metabolized
    const oldEntry = makeLog(14, new Date(Date.now() - 100 * 3_600_000).toISOString());
    const result = computeBAC([oldEntry], { weightKg: 70, biologicalSex: 'male' });
    expect(result).toBe(0);
  });
});
