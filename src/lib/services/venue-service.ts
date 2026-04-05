import { getSupabaseClient } from '@/lib/supabase'

export interface VenueMatch {
  name: string
  placeId: string
  address?: string
}

/**
 * Attempts to match a venue using coordinates.
 * Calls the match-venue Edge Function which keeps the Google Places API key server-side.
 * Falls back gracefully to null if the function is unavailable or returns no result.
 */
export async function matchVenue(lat: number, lng: number): Promise<VenueMatch | null> {
  try {
    const client = getSupabaseClient()
    const { data, error } = await client.functions.invoke<VenueMatch | null>('match-venue', {
      body: { lat, lng },
    })

    if (error) {
      // Edge function unavailable — not a fatal error
      return null
    }

    return data ?? null
  } catch {
    // Network error or function not deployed — graceful fallback
    return null
  }
}
