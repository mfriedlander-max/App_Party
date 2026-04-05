import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanDrinkMock, scanDrink } from '@/lib/services/scan-service';

// Reset env between tests
beforeEach(() => {
  vi.unstubAllEnvs();
});

describe('scanDrinkMock', () => {
  it('returns a result with expected fields', () => {
    const result = scanDrinkMock();
    expect(typeof result.drinkType).toBe('string');
    expect(result.drinkType.length).toBeGreaterThan(0);
    expect(typeof result.abv).toBe('number');
    expect(result.abv).toBeGreaterThan(0);
    expect(typeof result.volumeMl).toBe('number');
    expect(result.volumeMl).toBeGreaterThan(0);
    expect(typeof result.standardDrinks).toBe('number');
    expect(result.standardDrinks).toBeGreaterThan(0);
    expect(typeof result.vesselType).toBe('string');
    expect(typeof result.fillLevel).toBe('number');
    expect(typeof result.confidence).toBe('number');
    expect(result.isMock).toBe(true);
  });

  it('returns one of the known mock drinks', () => {
    const knownTypes = ['Budweiser', 'Margarita', 'Red Wine', 'Tequila Shot'];
    const result = scanDrinkMock();
    expect(knownTypes).toContain(result.drinkType);
  });
});

describe('scanDrink — fallback to mock when no API key', () => {
  it('falls back to mock result when no Supabase or OpenAI key configured', async () => {
    // Ensure no keys are set
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    vi.stubEnv('VITE_OPENAI_API_KEY', '');

    const result = await scanDrink('fake-base64-image-data');
    expect(result.isMock).toBe(true);
    expect(typeof result.drinkType).toBe('string');
    expect(result.drinkType.length).toBeGreaterThan(0);
  });
});
