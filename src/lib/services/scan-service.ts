import { getSupabaseClient } from '@/lib/supabase'

export interface ScanResult {
  drinkType: string
  brand: string | null
  vesselType: string
  fillLevel: number
  abv: number
  volumeMl: number
  standardDrinks: number
  confidence: number
  isMock: boolean
}

interface RawScanResponse {
  drink_type: string
  brand: string | null
  vessel_type: string
  fill_level: number
  abv: number
  volume_ml: number
  standard_drinks: number
  confidence: number
}

const MOCK_DRINKS: ScanResult[] = [
  {
    drinkType: 'Budweiser',
    brand: 'Budweiser',
    vesselType: 'can',
    fillLevel: 1.0,
    abv: 0.05,
    volumeMl: 355,
    standardDrinks: 1.0,
    confidence: 1.0,
    isMock: true,
  },
  {
    drinkType: 'Margarita',
    brand: null,
    vesselType: 'rocks glass',
    fillLevel: 0.9,
    abv: 0.15,
    volumeMl: 177,
    standardDrinks: 1.5,
    confidence: 1.0,
    isMock: true,
  },
  {
    drinkType: 'Red Wine',
    brand: null,
    vesselType: 'wine glass',
    fillLevel: 0.75,
    abv: 0.13,
    volumeMl: 148,
    standardDrinks: 1.1,
    confidence: 1.0,
    isMock: true,
  },
  {
    drinkType: 'Tequila Shot',
    brand: null,
    vesselType: 'shot glass',
    fillLevel: 1.0,
    abv: 0.40,
    volumeMl: 44,
    standardDrinks: 1.0,
    confidence: 1.0,
    isMock: true,
  },
]

function rawToScanResult(raw: RawScanResponse): ScanResult {
  return {
    drinkType: raw.drink_type,
    brand: raw.brand,
    vesselType: raw.vessel_type,
    fillLevel: raw.fill_level,
    abv: raw.abv,
    volumeMl: raw.volume_ml,
    standardDrinks: raw.standard_drinks,
    confidence: raw.confidence,
    isMock: false,
  }
}

/**
 * Calls the deployed Supabase Edge Function for drink scanning.
 * Requires the Supabase client to be configured.
 */
export async function scanDrinkViaEdgeFunction(imageBase64: string): Promise<ScanResult> {
  const client = getSupabaseClient()
  const { data: { session } } = await client.auth.getSession()
  const userId = session?.user?.id ?? 'anonymous'

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

  const res = await fetch(`${supabaseUrl}/functions/v1/scan-drink`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ imageBase64, userId }),
  })

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`Edge function error ${res.status}: ${errBody}`)
  }

  const raw = await res.json() as RawScanResponse
  return rawToScanResult(raw)
}

/**
 * Calls OpenAI directly from the client — for development when Edge Function
 * is not yet deployed. Requires VITE_OPENAI_API_KEY to be set.
 */
export async function scanDrinkLocally(imageBase64: string): Promise<ScanResult> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
  if (!apiKey) {
    throw new Error('VITE_OPENAI_API_KEY is not set')
  }

  const prompt = `You are a drink identification assistant. Analyze this photo and identify:
1. drink_type: The specific drink name (e.g., "Margarita", "Budweiser", "Red Wine")
2. brand: The brand if visible (e.g., "Budweiser", "White Claw") or null
3. vessel_type: The container (e.g., "pint glass", "wine glass", "shot glass", "solo cup", "can", "bottle")
4. fill_level: How full the vessel is (0.0 to 1.0)
5. estimated_abv: Your best estimate of alcohol by volume (e.g., 0.05 for 5%)
6. category: One of "beer", "cocktail", "shot", "wine", "spirit", "other"

Respond as JSON only. No explanation.`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
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
                url: `data:image/jpeg;base64,${imageBase64}`,
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

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`OpenAI API error ${res.status}: ${errText}`)
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>
  }
  const content = data.choices[0]?.message?.content
  if (!content) throw new Error('Empty response from OpenAI')

  const parsed = JSON.parse(content) as {
    drink_type: string
    brand: string | null
    vessel_type: string
    fill_level: number
    estimated_abv: number
    category: string
  }

  const volumeMl = estimateVolumeMl(parsed.vessel_type)
  const standardDrinks = computeStandardDrinks(volumeMl, parsed.estimated_abv, parsed.fill_level)

  return {
    drinkType: parsed.drink_type,
    brand: parsed.brand,
    vesselType: parsed.vessel_type,
    fillLevel: parsed.fill_level,
    abv: parsed.estimated_abv,
    volumeMl,
    standardDrinks: parseFloat(standardDrinks.toFixed(2)),
    confidence: 0.85,
    isMock: false,
  }
}

/**
 * Returns a random mock drink. Used as the final fallback when no API key
 * is configured and the Edge Function is unavailable.
 */
export function scanDrinkMock(): ScanResult {
  const idx = Math.floor(Math.random() * MOCK_DRINKS.length)
  return MOCK_DRINKS[idx] ?? MOCK_DRINKS[0]
}

/**
 * Main entry point. Tries Edge Function → local OpenAI → mock fallback.
 */
export async function scanDrink(imageBase64: string): Promise<ScanResult> {
  const hasOpenAiKey = Boolean(import.meta.env.VITE_OPENAI_API_KEY)
  const hasSupabase = Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
  )

  if (hasSupabase) {
    try {
      return await scanDrinkViaEdgeFunction(imageBase64)
    } catch {
      // Fall through to local or mock
    }
  }

  if (hasOpenAiKey) {
    try {
      return await scanDrinkLocally(imageBase64)
    } catch {
      // Fall through to mock
    }
  }

  return scanDrinkMock()
}

// ── Shared helpers ────────────────────────────────────────────────────────────

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
