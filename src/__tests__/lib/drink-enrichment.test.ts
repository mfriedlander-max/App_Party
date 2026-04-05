import { describe, it, expect } from 'vitest';
import {
  parseAbvFromOFF,
  inferCategoryFromOFF,
  computeStandardDrinks,
  offProductToCatalogInsert,
} from '@/lib/services/drink-enrichment';
import type { OFFProduct } from '@/lib/services/drink-enrichment';

// ─── parseAbvFromOFF ──────────────────────────────────────────────────────────

describe('parseAbvFromOFF', () => {
  it('returns abv from alcohol_100g field', () => {
    const product: OFFProduct = { alcohol_100g: 5.0 };
    expect(parseAbvFromOFF(product)).toBeCloseTo(0.05, 5);
  });

  it('returns abv from nutriments.alcohol_100g field', () => {
    const product: OFFProduct = { nutriments: { alcohol_100g: 12.0 } };
    expect(parseAbvFromOFF(product)).toBeCloseTo(0.12, 5);
  });

  it('returns abv from nutriments.alcohol field', () => {
    const product: OFFProduct = { nutriments: { alcohol: 4.2 } };
    expect(parseAbvFromOFF(product)).toBeCloseTo(0.042, 5);
  });

  it('returns null when no alcohol field present', () => {
    const product: OFFProduct = { product_name: 'Mystery Drink' };
    expect(parseAbvFromOFF(product)).toBeNull();
  });

  it('returns null when alcohol value is 0', () => {
    const product: OFFProduct = { alcohol_100g: 0 };
    expect(parseAbvFromOFF(product)).toBeNull();
  });

  it('prefers alcohol_100g over nutriments', () => {
    const product: OFFProduct = { alcohol_100g: 6.0, nutriments: { alcohol_100g: 3.0 } };
    expect(parseAbvFromOFF(product)).toBeCloseTo(0.06, 5);
  });
});

// ─── inferCategoryFromOFF ────────────────────────────────────────────────────

describe('inferCategoryFromOFF', () => {
  it('returns beer for beer categories', () => {
    const product: OFFProduct = { categories_tags: ['en:beers', 'en:lagers'] };
    expect(inferCategoryFromOFF(product)).toBe('beer');
  });

  it('returns wine for wine categories', () => {
    const product: OFFProduct = { categories_tags: ['en:wines', 'en:red-wines'] };
    expect(inferCategoryFromOFF(product)).toBe('wine');
  });

  it('returns spirit for vodka categories', () => {
    const product: OFFProduct = { categories_tags: ['en:spirits', 'en:vodka'] };
    expect(inferCategoryFromOFF(product)).toBe('spirit');
  });

  it('returns spirit for whiskey categories', () => {
    const product: OFFProduct = { categories_tags: ['en:whiskey'] };
    expect(inferCategoryFromOFF(product)).toBe('spirit');
  });

  it('returns spirit for whisky (alternate spelling)', () => {
    const product: OFFProduct = { categories_tags: ['en:scotch-whisky'] };
    expect(inferCategoryFromOFF(product)).toBe('spirit');
  });

  it('returns cocktail for cocktail categories', () => {
    const product: OFFProduct = { categories_tags: ['en:cocktails'] };
    expect(inferCategoryFromOFF(product)).toBe('cocktail');
  });

  it('returns other for unknown categories', () => {
    const product: OFFProduct = { categories_tags: ['en:beverages'] };
    expect(inferCategoryFromOFF(product)).toBe('other');
  });

  it('returns other when categories_tags is absent', () => {
    const product: OFFProduct = { product_name: 'Unknown' };
    expect(inferCategoryFromOFF(product)).toBe('other');
  });
});

// ─── computeStandardDrinks ───────────────────────────────────────────────────

describe('computeStandardDrinks', () => {
  it('computes standard drinks for a standard beer (5% 355ml)', () => {
    // 355 * 0.05 * 0.789 / 14 = 1.00
    expect(computeStandardDrinks(0.05, 355)).toBeCloseTo(1.00, 1);
  });

  it('computes standard drinks for a wine pour (13% 150ml)', () => {
    // 150 * 0.13 * 0.789 / 14 ≈ 1.10
    expect(computeStandardDrinks(0.13, 150)).toBeCloseTo(1.10, 1);
  });

  it('computes standard drinks for a shot (40% 44ml)', () => {
    // 44 * 0.40 * 0.789 / 14 ≈ 0.99
    expect(computeStandardDrinks(0.40, 44)).toBeCloseTo(0.99, 1);
  });

  it('returns 0 for zero abv', () => {
    expect(computeStandardDrinks(0, 355)).toBe(0);
  });

  it('returns 0 for zero volume', () => {
    expect(computeStandardDrinks(0.05, 0)).toBe(0);
  });
});

// ─── offProductToCatalogInsert ───────────────────────────────────────────────

describe('offProductToCatalogInsert', () => {
  it('maps product name and brand', () => {
    const product: OFFProduct = {
      product_name: 'Budweiser',
      brands: 'Anheuser-Busch, AB InBev',
      categories_tags: ['en:beers'],
    };
    const result = offProductToCatalogInsert(product, 0.05);
    expect(result.name).toBe('Budweiser');
    expect(result.brand).toBe('Anheuser-Busch');
  });

  it('sets source to openfoodfacts', () => {
    const product: OFFProduct = { product_name: 'Test Beer', categories_tags: ['en:beers'] };
    const result = offProductToCatalogInsert(product, 0.042);
    expect(result.source).toBe('openfoodfacts');
  });

  it('uses Unknown Drink when product_name is absent', () => {
    const product: OFFProduct = { categories_tags: ['en:beers'] };
    const result = offProductToCatalogInsert(product, 0.05);
    expect(result.name).toBe('Unknown Drink');
  });

  it('sets null brand when brands field is absent', () => {
    const product: OFFProduct = { product_name: 'Generic Lager', categories_tags: ['en:beers'] };
    const result = offProductToCatalogInsert(product, 0.05);
    expect(result.brand).toBeNull();
  });

  it('infers correct category', () => {
    const product: OFFProduct = {
      product_name: 'Chardonnay',
      categories_tags: ['en:wines', 'en:white-wines'],
    };
    const result = offProductToCatalogInsert(product, 0.13);
    expect(result.category).toBe('wine');
  });

  it('computes standard_drinks', () => {
    const product: OFFProduct = { product_name: 'Test', categories_tags: ['en:beers'] };
    const result = offProductToCatalogInsert(product, 0.05);
    // 355 * 0.05 * 0.789 / 14 ≈ 1.00
    expect(result.standard_drinks).toBeCloseTo(1.00, 1);
  });
});

// ─── offProductToCatalogInsert — ABV passthrough ─────────────────────────────

describe('offProductToCatalogInsert — abv passthrough', () => {
  it('uses the provided abv value directly', () => {
    const product: OFFProduct = { product_name: 'Test Lager', categories_tags: ['en:beers'] };
    const result = offProductToCatalogInsert(product, 0.042);
    expect(result.abv).toBeCloseTo(0.042, 5);
  });

  it('standard_volume_ml is 355', () => {
    const product: OFFProduct = { product_name: 'Slim Can Beer', categories_tags: ['en:beers'] };
    const result = offProductToCatalogInsert(product, 0.05);
    expect(result.standard_volume_ml).toBe(355);
  });
});
