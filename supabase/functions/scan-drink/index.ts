// Deno Edge Function — scan-drink
// Receives a base64 image, calls GPT-4o Vision, returns identified drink details.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

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
}

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
  return 355 // default to can/bottle
}

function computeStandardDrinks(volumeMl: number, abv: number, fillLevel: number): number {
  const alcoholMl = volumeMl * fillLevel * abv
  const alcoholGrams = alcoholMl * 0.789
  return alcoholGrams / 14
}

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
5. estimated_abv: Your best estimate of alcohol by volume (e.g., 0.05 for 5%)
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

  // Try to find a matching entry in drink_catalog for a more accurate ABV
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  let catalogAbv: number | null = null

  if (supabaseUrl && supabaseServiceKey) {
    try {
      const client = createClient(supabaseUrl, supabaseServiceKey)
      const { data } = await client
        .from('drink_catalog')
        .select('abv')
        .ilike('name', `%${gptResult.drink_type}%`)
        .limit(1)
        .single()
      if (data) catalogAbv = (data as { abv: number }).abv
    } catch {
      // Catalog lookup is best-effort
    }
  }

  const abv = catalogAbv ?? gptResult.estimated_abv
  const volumeMl = estimateVolumeMl(gptResult.vessel_type)
  const standardDrinks = computeStandardDrinks(volumeMl, abv, gptResult.fill_level)

  const response: ScanResponse = {
    drink_type: gptResult.drink_type,
    brand: gptResult.brand,
    vessel_type: gptResult.vessel_type,
    fill_level: gptResult.fill_level,
    abv,
    volume_ml: volumeMl,
    standard_drinks: parseFloat(standardDrinks.toFixed(2)),
    confidence: 0.85,
  }

  return new Response(JSON.stringify(response), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
})
