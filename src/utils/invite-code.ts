const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CODE_LENGTH = 6;

/**
 * Generates a 6-character uppercase alphanumeric invite code
 * using crypto.getRandomValues for randomness.
 */
export function generateInviteCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => CHARSET[b % CHARSET.length])
    .join('');
}
