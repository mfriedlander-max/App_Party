// Deno Edge Function — scan-drink
// Receives a base64 image, calls GPT-4o Vision, enriches via drink_catalog,
// OpenFoodFacts, and containers table, then returns identified drink details.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScanRequestBody {
  imageBase64: string
  userId: string
}

interface GPTVisionResult {
  drink_type: string
  brand: string | null
  vessel_type: string
  fill_level: number
  estimated_abv: number
  category: 'beer' | 'cocktail' | 'shot' | 'wine' | 'spirit' | 'other'
}

interface ScanResponse {
  drink_type: string
  brand: string | null
  vessel_type: string
  fill_level: number
  abv: number
  volume_ml: number
  standard_drinks: number
  confidence: number
  catalog_id: string | null
  enrichment_source: string
}

interface DrinkCatalogRow {
  id: string
  name: string
  brand: string | null
  category: string
  emoji: string
  abv: number
  standard_volume_ml: number
  standard_drinks: number
  source: string | null
}

interface ContainerRow {
  name: string
  volume_ml: number
  typical_fill: number
}

interface OFFProduct {
  product_name?: string
  brands?: string
  alcohol_100g?: number
  nutriments?: { alcohol?: number; alcohol_100g?: number }
  categories_tags?: string[]
}

interface OFFProductResponse {
  status: number
  product?: OFFProduct
}

interface OFFSearchResponse {
  products?: OFFProduct[]
}

interface CategoryDefaultRow {
  default_abv: number
  default_volume_ml: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VESSEL_VOLUMES: Record<string, number> = {
  'pint glass': 473,
  'wine glass': 148,
  'shot glass': 44,
  'solo cup': 473,
  'can': 355,
  'bottle': 355,
  'rocks glass': 177,
  'highball glass': 355,
  'martini glass': 148,
  'champagne flute': 148,
}

function estimateVolumeMl(vesselType: string): number {
  const lower = vesselType.toLowerCase()
  for (const [key, volume] of Object.entries(VESSEL_VOLUMES)) {
    if (lower.includes(key)) return volume
  }
  return 355
}

function computeStandardDrinks(volumeMl: number, abv: number, fillLevel: number): number {
  const alcoholMl = volumeMl * fillLevel * abv
  const alcoholGrams = alcoholMl * 0.789
  return alcoholGrams / 14
}

function parseAbvFromOFF(product: OFFProduct): number | null {
  const val = product.alcohol_100g ?? product.nutriments?.alcohol_100g ?? product.nutriments?.alcohol
  if (val != null && val > 0) return val / 100
  return null
}

// ─── Enrichment steps ────────────────────────────────────────────────────────

type SupabaseClient = ReturnType<typeof createClient>

async function searchLocalCatalog(
  client: SupabaseClient,
  drinkType: string,
  brand: string | null,
): Promise<{ row: DrinkCatalogRow; source: string } | null> {
  const term = brand ?? drinkType
  const { data } = await client
    .from('drink_catalog')
    .select('id, name, brand, category, emoji, abv, standard_volume_ml, standard_drinks, source')
    .or(`name.ilike.%${term}%,brand.ilike.%${term}%`)
    .limit(1)
    .maybeSingle()

  if (!data) return null
  return { row: data as DrinkCatalogRow, source: 'local_catalog' }
}

async function searchOpenFoodFacts(name: string): Promise<{ abv: number; brand: string | null } | null> {
  try {
    const params = new URLSearchParams({
      search_terms: name,
      categories_tags_en: 'alcoholic-beverages',
      fields: 'product_name,brands,alcohol_100g,nutriments,categories_tags',
      page_size: '5',
      json: '1',
    })
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/search?${params}`)
    if (!res.ok) return null
    const data = await res.json() as OFFSearchResponse
    for (const product of data.products ?? []) {
      const abv = parseAbvFromOFF(product)
      if (abv && abv > 0) {
        return { abv, brand: product.brands?.split(',')[0]?.trim() ?? null }
      }
    }
  } catch {
    // Best-effort
  }
  return null
}

async function lookupBarcodeOFF(barcode: string): Promise<{ abv: number; brand: string | null } | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`)
    if (!res.ok) return null
    const data = await res.json() as OFFProductResponse
    if (data.status !== 1 || !data.product) return null
    const abv = parseAbvFromOFF(data.product)
    if (!abv) return null
    return { abv, brand: data.product.brands?.split(',')[0]?.trim() ?? null }
  } catch {
    return null
  }
}

async function getCategoryDefault(
  client: SupabaseClient,
  category: string,
): Promise<CategoryDefaultRow | null> {
  const { data } = await client
    .from('category_defaults')
    .select('default_abv, default_volume_ml')
    .eq('category', category)
    .limit(1)
    .maybeSingle()
  return data as CategoryDefaultRow | null
}

async function getContainerVolume(
  client: SupabaseClient,
  vesselType: string,
): Promise<{ volumeMl: number; typicalFill: number }> {
  const lower = vesselType.toLowerCase()
  const { data } = await client
    .from('containers')
    .select('name, volume_ml, typical_fill')
    .limit(20)

  if (data) {
    const containers = data as ContainerRow[]
    const match = containers.find(
      (c) => c.name.toLowerCase().includes(lower) || lower.includes(c.name.toLowerCase()),
    )
    if (match) return { volumeMl: match.volume_ml, typicalFill: match.typical_fill }
  }

  return { volumeMl: estimateVolumeMl(vesselType), typicalFill: 1.0 }
}

async function cacheToLocalCatalog(
  client: SupabaseClient,
  item: Omit<DrinkCatalogRow, 'id'>,
): Promise<string | null> {
  try {
    const { data } = await client
      .from('drink_catalog')
      .insert(item)
      .select('id')
      .single()
    return (data as { id: string } | null)?.id ?? null
  } catch {
    return null
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    return new Response(
      JSON.stringify({ error: 'OpenAI API key not configured' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  let body: ScanRequestBody
  try {
    body = await req.json() as ScanRequestBody
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  if (!body.imageBase64 || !body.userId) {
    return new Response(
      JSON.stringify({ error: 'imageBase64 and userId are required' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  const prompt = `You are a drink identification assistant. Analyze this photo and identify:
1. drink_type: The specific drink name (e.g., "Margarita", "Budweiser", "Red Wine")
2. brand: The brand if visible (e.g., "Budweiser", "White Claw") or null
3. vessel_type: The container (e.g., "pint glass", "wine glass", "shot glass", "solo cup", "can", "bottle")
4. fill_level: How full the vessel is (0.0 to 1.0)
5. estimated_abv: Your best estimate of alcohol by volume as a decimal (e.g., 0.05 for 5%)
6. category: One of "beer", "cocktail", "shot", "wine", "spirit", "other"

Respond as JSON only. No explanation.`

  let gptResult: GPTVisionResult
  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${body.imageBase64}`,
                  detail: 'low',
                },
              },
            ],
          },
        ],
        max_tokens: 256,
        response_format: { type: 'json_object' },
      }),
    })

    if (!openaiRes.ok) {
      const errText = await openaiRes.text()
      throw new Error(`OpenAI API error ${openaiRes.status}: ${errText}`)
    }

    const openaiData = await openaiRes.json() as {
      choices: Array<{ message: { content: string } }>
    }
    const content = openaiData.choices[0]?.message?.content
    if (!content) throw new Error('Empty response from OpenAI')
    gptResult = JSON.parse(content) as GPTVisionResult
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Vision API failed: ${err instanceof Error ? err.message : String(err)}` }),
      { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  // ── Enrichment pipeline ──────────────────────────────────────────────────

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  let abv = gptResult.estimated_abv
  let catalogId: string | null = null
  let enrichmentSource = 'gpt_estimate'
  let resolvedBrand = gptResult.brand

  if (supabaseUrl && supabaseServiceKey) {
    const client = createClient(supabaseUrl, supabaseServiceKey)

    // Step 1: local catalog search
    const localMatch = await searchLocalCatalog(client, gptResult.drink_type, gptResult.brand)
    if (localMatch) {
      abv = localMatch.row.abv
      catalogId = localMatch.row.id
      resolvedBrand = localMatch.row.brand
      enrichmentSource = 'local_catalog'
    } else {
      // Step 2: OpenFoodFacts name search
      const offResult = await searchOpenFoodFacts(gptResult.drink_type)
      if (offResult) {
        abv = offResult.abv
        resolvedBrand = offResult.brand ?? gptResult.brand
        enrichmentSource = 'openfoodfacts'

        // Cache the discovery to drink_catalog
        catalogId = await cacheToLocalCatalog(client, {
          name: gptResult.drink_type,
          brand: resolvedBrand,
          category: gptResult.category,
          emoji: '',
          abv,
          standard_volume_ml: 355,
          standard_drinks: parseFloat((computeStandardDrinks(355, abv, 1.0)).toFixed(2)),
          source: 'openfoodfacts',
        })
      } else {
        // Step 3: category default fallback
        const catDefault = await getCategoryDefault(client, gptResult.category)
        if (catDefault) {
          abv = catDefault.default_abv
          enrichmentSource = 'category_default'
        }
      }
    }

    // Container lookup for accurate volume
    const container = await getContainerVolume(client, gptResult.vessel_type)
    const volumeMl = container.volumeMl
    const standardDrinks = computeStandardDrinks(volumeMl, abv, gptResult.fill_level)

    const response: ScanResponse = {
      drink_type: gptResult.drink_type,
      brand: resolvedBrand,
      vessel_type: gptResult.vessel_type,
      fill_level: gptResult.fill_level,
      abv,
      volume_ml: volumeMl,
      standard_drinks: parseFloat(standardDrinks.toFixed(2)),
      confidence: enrichmentSource === 'local_catalog' ? 0.95
        : enrichmentSource === 'openfoodfacts' ? 0.85
        : enrichmentSource === 'category_default' ? 0.70
        : 0.60,
      catalog_id: catalogId,
      enrichment_source: enrichmentSource,
    }

    return new Response(JSON.stringify(response), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  // Fallback: no Supabase configured — use GPT result only
  const volumeMl = estimateVolumeMl(gptResult.vessel_type)
  const standardDrinks = computeStandardDrinks(volumeMl, abv, gptResult.fill_level)

  const fallbackResponse: ScanResponse = {
    drink_type: gptResult.drink_type,
    brand: gptResult.brand,
    vessel_type: gptResult.vessel_type,
    fill_level: gptResult.fill_level,
    abv,
    volume_ml: volumeMl,
    standard_drinks: parseFloat(standardDrinks.toFixed(2)),
    confidence: 0.60,
    catalog_id: null,
    enrichment_source: 'gpt_estimate',
  }

  return new Response(JSON.stringify(fallbackResponse), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
})
