import { getSupabaseClient } from '@/lib/supabase'

export interface LocationLogRow {
  id: string
  user_id: string
  party_id: string | null
  lat: number
  lng: number
  venue_name: string | null
  venue_place_id: string | null
  logged_at: string
}

export async function logLocation(
  userId: string,
  partyId: string | null,
  lat: number,
  lng: number,
): Promise<LocationLogRow> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('location_log')
    .insert({ user_id: userId, party_id: partyId, lat, lng })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to log location: ${error.message}`)
  }

  return data as LocationLogRow
}

export async function fetchLocationsForParty(partyId: string): Promise<LocationLogRow[]> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('location_log')
    .select('*')
    .eq('party_id', partyId)
    .order('logged_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch party locations: ${error.message}`)
  }

  return (data ?? []) as LocationLogRow[]
}

export async function fetchLocationsForUser(
  userId: string,
  since: string,
): Promise<LocationLogRow[]> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('location_log')
    .select('*')
    .eq('user_id', userId)
    .gt('logged_at', since)
    .order('logged_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch user locations: ${error.message}`)
  }

  return (data ?? []) as LocationLogRow[]
}

export async function updateVenueInfo(
  locationId: string,
  venueName: string,
  venuePlaceId: string,
): Promise<void> {
  const client = getSupabaseClient()
  const { error } = await client
    .from('location_log')
    .update({ venue_name: venueName, venue_place_id: venuePlaceId })
    .eq('id', locationId)

  if (error) {
    throw new Error(`Failed to update venue info: ${error.message}`)
  }
}
