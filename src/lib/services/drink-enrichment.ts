import { getSupabaseClient } from '@/lib/supabase'
import type { DrinkCatalogRow } from '@/lib/repositories/drink-repository'

// ─── Public types ────────────────────────────────────────────────────────────

export interface EnrichmentQuery {
  name?: string
  brand?: string
  barcode?: string
  category?: string
}

export interface CategoryDefaultRow {
  id: string
  category: string
  subcategory: string
  display_name: string
  default_abv: number
  default_volume_ml: number
  default_container: string | null
  emoji: string
}

// ─── OpenFoodFacts types ─────────────────────────────────────────────────────

interface OFFProduct {
  product_name?: string
  brands?: string
  alcohol_100g?: number
  nutriments?: { alcohol?: number; 'alcohol_100g'?: number }
  categories_tags?: string[]
  quantity?: string
}

interface OFFProductResponse {
  status: number
  product?: OFFProduct
}

interface OFFSearchResponse {
  products?: OFFProduct[]
  count?: number
}

// ─── Rate limiter (10 req/min for search, 100/min for product) ───────────────

const rateQueue = {
  search: { timestamps: [] as number[], maxPerMinute: 10 },
  product: { timestamps: [] as number[], maxPerMinute: 100 },
}

function checkRateLimit(type: 'search' | 'product'): boolean {
  const now = Date.now()
  const bucket = rateQueue[type]
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < 60_000)
  if (bucket.timestamps.length >= bucket.maxPerMinute) return false
  bucket.timestamps.push(now)
  return true
}

// ─── Local catalog cache ─────────────────────────────────────────────────────

const OFF_BASE = 'https://world.openfoodfacts.org'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseAbvFromOFF(product: OFFProduct): number | null {
  const direct = product.alcohol_100g ?? product.nutriments?.alcohol_100g ?? product.nutriments?.alcohol
  if (direct != null && direct > 0) return direct / 100
  return null
}

function inferCategoryFromOFF(product: OFFProduct): DrinkCatalogRow['category'] {
  const tags = (product.categories_tags ?? []).join(' ').toLowerCase()
  if (tags.includes('beer') || tags.includes('lager') || tags.includes('ale')) return 'beer'
  if (tags.includes('wine') || tags.includes('champagne') || tags.includes('prosecco')) return 'wine'
  if (tags.includes('spirit') || tags.includes('vodka') || tags.includes('whiskey') || tags.includes('whisky') || tags.includes('rum') || tags.includes('gin') || tags.includes('tequila') || tags.includes('cognac') || tags.includes('brandy')) return 'spirit'
  if (tags.includes('cocktail') || tags.includes('mixed')) return 'cocktail'
  if (tags.includes('shot')) return 'shot'
  return 'other'
}

function inferEmojiFromCategory(category: DrinkCatalogRow['category']): string {
  const map: Record<DrinkCatalogRow['category'], string> = {
    beer: '🍺', cocktail: '🍹', shot: '🥃', wine: '🍷', spirit: '🥃', other: '🥤',
  }
  return map[category]
}

function computeStandardDrinks(abv: number, volumeMl: number): number {
  const alcoholGrams = volumeMl * abv * 0.789
  return parseFloat((alcoholGrams / 14).toFixed(2))
}

function offProductToCatalogInsert(
  product: OFFProduct,
  abv: number,
): Omit<DrinkCatalogRow, 'id' | 'created_at'> {
  const category = inferCategoryFromOFF(product)
  const volumeMl = 355
  return {
    name: product.product_name ?? 'Unknown Drink',
    brand: product.brands?.split(',')[0]?.trim() ?? null,
    category,
    emoji: inferEmojiFromCategory(category),
    abv,
    standard_volume_ml: volumeMl,
    standard_drinks: computeStandardDrinks(abv, volumeMl),
    source: 'openfoodfacts',
    image_url: null,
  }
}

// ─── Step 1: local catalog search ────────────────────────────────────────────

async function searchLocalCatalog(query: EnrichmentQuery): Promise<DrinkCatalogRow | null> {
  const client = getSupabaseClient()
  const term = query.name ?? query.brand ?? ''
  if (!term) return null

  const { data, error } = await client
    .from('drink_catalog')
    .select('*')
    .or(`name.ilike.%${term}%,brand.ilike.%${term}%`)
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data as DrinkCatalogRow
}

// ─── Step 2: OpenFoodFacts barcode lookup ─────────────────────────────────────

async function lookupByBarcode(barcode: string): Promise<DrinkCatalogRow | null> {
  if (!checkRateLimit('product')) return null

  let response: OFFProductResponse
  try {
    const res = await fetch(`${OFF_BASE}/api/v2/product/${barcode}.json`)
    if (!res.ok) return null
    response = await res.json() as OFFProductResponse
  } catch {
    return null
  }

  if (response.status !== 1 || !response.product) return null
  const abv = parseAbvFromOFF(response.product)
  if (!abv) return null

  const insert = offProductToCatalogInsert(response.product, abv)
  return cacheToLocalCatalog(insert)
}

// ─── Step 3: OpenFoodFacts name search ────────────────────────────────────────

async function searchOpenFoodFacts(name: string): Promise<DrinkCatalogRow | null> {
  if (!checkRateLimit('search')) return null

  let response: OFFSearchResponse
  try {
    const params = new URLSearchParams({
      search_terms: name,
      categories_tags_en: 'alcoholic-beverages',
      fields: 'product_name,brands,alcohol_100g,nutriments,categories_tags,quantity',
      page_size: '5',
      json: '1',
    })
    const res = await fetch(`${OFF_BASE}/api/v2/search?${params.toString()}`)
    if (!res.ok) return null
    response = await res.json() as OFFSearchResponse
  } catch {
    return null
  }

  const products = response.products ?? []
  for (const product of products) {
    const abv = parseAbvFromOFF(product)
    if (abv && abv > 0) {
      const insert = offProductToCatalogInsert(product, abv)
      return cacheToLocalCatalog(insert)
    }
  }

  return null
}

// ─── Step 4: category default fallback ───────────────────────────────────────

async function getCategoryDefault(category: string): Promise<DrinkCatalogRow | null> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('category_defaults')
    .select('*')
    .eq('category', category)
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  const row = data as CategoryDefaultRow

  return {
    id: row.id,
    name: row.display_name,
    brand: null,
    category: row.category as DrinkCatalogRow['category'],
    emoji: row.emoji,
    abv: row.default_abv,
    standard_volume_ml: row.default_volume_ml,
    standard_drinks: computeStandardDrinks(row.default_abv, row.default_volume_ml),
    source: 'category_default',
    image_url: null,
    created_at: new Date().toISOString(),
  }
}

// ─── Step 5: cache to local catalog ─────────────────────────────────────────

async function cacheToLocalCatalog(
  item: Omit<DrinkCatalogRow, 'id' | 'created_at'>,
): Promise<DrinkCatalogRow | null> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('drink_catalog')
    .insert(item)
    .select()
    .single()

  if (error) {
    // Possibly a duplicate — try to fetch existing
    const { data: existing } = await client
      .from('drink_catalog')
      .select('*')
      .ilike('name', item.name)
      .limit(1)
      .maybeSingle()
    return existing as DrinkCatalogRow | null
  }

  return data as DrinkCatalogRow
}

// ─── Main enrichment pipeline ─────────────────────────────────────────────────

export async function enrichDrink(query: EnrichmentQuery): Promise<DrinkCatalogRow | null> {
  // Step 1: local catalog
  const local = await searchLocalCatalog(query)
  if (local) return local

  // Step 2: barcode lookup
  if (query.barcode) {
    const byBarcode = await lookupByBarcode(query.barcode)
    if (byBarcode) return byBarcode
  }

  // Step 3: name search via OpenFoodFacts
  if (query.name) {
    const byName = await searchOpenFoodFacts(query.name)
    if (byName) return byName
  }

  // Step 4: category default
  if (query.category) {
    const def = await getCategoryDefault(query.category)
    if (def) return def
  }

  return null
}

// ─── Exported helpers for testing ─────────────────────────────────────────────

export { parseAbvFromOFF, inferCategoryFromOFF, computeStandardDrinks, offProductToCatalogInsert }
export type { OFFProduct, OFFProductResponse, OFFSearchResponse }
