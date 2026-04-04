import { describe, it, expect } from 'vitest';
import { generateInviteCode } from '@/utils/invite-code';

describe('generateInviteCode', () => {
  it('returns a 6-character string', () => {
    expect(generateInviteCode()).toHaveLength(6);
  });

  it('contains only uppercase alphanumeric characters', () => {
    const code = generateInviteCode();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('two consecutive calls produce different codes', () => {
    const a = generateInviteCode();
    const b = generateInviteCode();
    // Extremely unlikely to be equal; if it fails, re-run
    expect(a).not.toBe(b);
  });

  it('produces only valid characters across many calls', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateInviteCode()).toMatch(/^[A-Z0-9]{6}$/);
    }
  });
});
