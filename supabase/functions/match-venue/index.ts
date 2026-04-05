// Deno Edge Function — match-venue
// Receives { lat, lng }, calls Google Places Nearby Search, returns closest bar/restaurant/nightclub.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
  lat: number
  lng: number
}

interface VenueResult {
  name: string
  placeId: string
  address: string
}

interface PlacesNearbyResult {
  name: string
  place_id: string
  vicinity: string
}

interface PlacesNearbyResponse {
  results: PlacesNearbyResult[]
  status: string
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

  const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
  if (!googleApiKey) {
    // No API key configured — return null gracefully
    return new Response(
      JSON.stringify(null),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  let body: RequestBody
  try {
    body = await req.json() as RequestBody
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  if (typeof body.lat !== 'number' || typeof body.lng !== 'number') {
    return new Response(
      JSON.stringify({ error: 'lat and lng are required numbers' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  const params = new URLSearchParams({
    location: `${body.lat},${body.lng}`,
    radius: '100',
    type: 'bar|restaurant|night_club',
    key: googleApiKey,
  })

  let placesData: PlacesNearbyResponse
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`,
    )
    if (!res.ok) {
      throw new Error(`Places API returned ${res.status}`)
    }
    placesData = await res.json() as PlacesNearbyResponse
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Places API failed: ${err instanceof Error ? err.message : String(err)}` }),
      { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  const first = placesData.results[0]
  if (!first) {
    return new Response(
      JSON.stringify(null),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  const result: VenueResult = {
    name: first.name,
    placeId: first.place_id,
    address: first.vicinity,
  }

  return new Response(JSON.stringify(result), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
})
