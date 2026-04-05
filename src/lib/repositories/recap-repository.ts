import { getSupabaseClient } from '@/lib/supabase'
import type { Recap, RecapSlide } from '@/types'
import type { ConsumptionLogRow } from './drink-repository'
import type { LocationLogRow } from './location-repository'
import type { MediaRow } from './media-repository'

// ─── DB row types ─────────────────────────────────────────────────────────────

interface RecapRow {
  id: string
  party_id: string
  slides: RecapSlide[]
  media_ids: string[]
  generated_at: string
  parties: {
    name: string
    start_time: string
    end_time: string | null
  } | null
}

interface PartyMemberRow {
  user_id: string
  done: boolean
  profiles: { name: string; avatar_url: string | null } | null
}

interface DrinkCatalogRow {
  id: string
  category: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  beer: '#FFD60A',
  cocktail: '#FF2D55',
  shot: '#00E5FF',
  wine: '#BF5AF2',
  spirit: '#FF9F0A',
  other: '#8E8E93',
}

function computePeakHour(logs: ConsumptionLogRow[]): number | null {
  if (logs.length === 0) return null
  const hourCounts = new Map<number, number>()
  for (const log of logs) {
    const hour = new Date(log.logged_at).getHours()
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1)
  }
  let peakHour = 0
  let peakCount = 0
  for (const [hour, count] of hourCounts) {
    if (count > peakCount) {
      peakCount = count
      peakHour = hour
    }
  }
  return peakHour
}

function formatHour(hour: number): string {
  if (hour === 0) return '12:00 AM'
  if (hour < 12) return `${hour}:00 AM`
  if (hour === 12) return '12:00 PM'
  return `${hour - 12}:00 PM`
}

function formatDuration(startIso: string, endIso: string): string {
  const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime()
  const totalMins = Math.floor(diffMs / 60_000)
  const hours = Math.floor(totalMins / 60)
  const mins = totalMins % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

function computeDrinkBreakdown(
  logs: ConsumptionLogRow[],
  catalog: DrinkCatalogRow[],
): Array<{ label: string; pct: number; color: string }> {
  const catalogById = new Map(catalog.map((c) => [c.id, c]))
  const categoryCounts = new Map<string, number>()

  for (const log of logs) {
    let category = 'other'
    if (log.catalog_item_id) {
      const item = catalogById.get(log.catalog_item_id)
      if (item) category = item.category
    }
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1)
  }

  const total = logs.length
  if (total === 0) return []

  return Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({
      label: category.charAt(0).toUpperCase() + category.slice(1),
      pct: count / total,
      color: CATEGORY_COLORS[category] ?? '#8E8E93',
    }))
}

function buildSlidesLocally(params: {
  partyName: string
  startTime: string
  endTime: string
  members: PartyMemberRow[]
  logs: ConsumptionLogRow[]
  catalog: DrinkCatalogRow[]
  locations: LocationLogRow[]
  media: MediaRow[]
}): RecapSlide[] {
  const { partyName, startTime, endTime, members, logs, catalog, locations, media } = params
  const duration = formatDuration(startTime, endTime)
  const totalDrinks = logs.length

  const drinksByUser = new Map<string, number>()
  for (const log of logs) {
    drinksByUser.set(log.user_id, (drinksByUser.get(log.user_id) ?? 0) + 1)
  }

  const venueSet = new Set<string>()
  for (const loc of locations) {
    if (loc.venue_name) venueSet.add(loc.venue_name)
  }
  const venueCount = venueSet.size

  const peakHour = computePeakHour(logs)
  const drinkBreakdown = computeDrinkBreakdown(logs, catalog)

  let mostDrinksUserId = ''
  let mostDrinksCount = 0
  for (const [uid, count] of drinksByUser) {
    if (count > mostDrinksCount) {
      mostDrinksCount = count
      mostDrinksUserId = uid
    }
  }

  let lastStandingUserId = ''
  let lastDrinkTime = 0
  for (const log of logs) {
    const t = new Date(log.logged_at).getTime()
    if (t > lastDrinkTime) {
      lastDrinkTime = t
      lastStandingUserId = log.user_id
    }
  }

  const venuesByUser = new Map<string, Set<string>>()
  for (const loc of locations) {
    if (!loc.venue_name) continue
    const set = venuesByUser.get(loc.user_id) ?? new Set()
    set.add(loc.venue_name)
    venuesByUser.set(loc.user_id, set)
  }
  let explorerUserId = ''
  let maxVenues = 0
  for (const [uid, venues] of venuesByUser) {
    if (venues.size > maxVenues) {
      maxVenues = venues.size
      explorerUserId = uid
    }
  }

  function memberName(userId: string): string {
    const m = members.find((mb) => mb.user_id === userId)
    return m?.profiles?.name ?? 'Someone'
  }

  const venueText = venueCount > 0 ? `, ${venueCount} venue${venueCount !== 1 ? 's' : ''}` : ''
  const slides: RecapSlide[] = []

  slides.push({
    id: 'slide-1',
    variant: 'stat-reveal',
    heading: 'Your Night in Numbers',
    subheading: `${duration}${venueText} · ${members.length} people`,
    value: `${totalDrinks} drinks`,
    backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  })

  slides.push({
    id: 'slide-2',
    variant: 'drink-breakdown',
    heading: 'Drinks Were Flowing',
    subheading: drinkBreakdown.length > 0
      ? `${drinkBreakdown[0].label}s led the night`
      : 'Here is what the crew consumed',
    value: `${totalDrinks} total drinks`,
    backgroundGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  })

  if (peakHour !== null) {
    slides.push({
      id: 'slide-3',
      variant: 'stat-reveal',
      heading: 'Peak of the Night',
      subheading: `Things peaked at ${formatHour(peakHour)}`,
      value: formatHour(peakHour),
      backgroundGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    })
  }

  slides.push({
    id: 'slide-4',
    variant: 'group-photo',
    heading: 'The Crew',
    subheading: `${members.length} people, one legendary night`,
    backgroundGradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  })

  const superlatives: string[] = []
  if (mostDrinksUserId) {
    superlatives.push(`Most Drinks: ${memberName(mostDrinksUserId)} (${mostDrinksCount})`)
  }
  if (lastStandingUserId && lastStandingUserId !== mostDrinksUserId) {
    superlatives.push(`Last One Standing: ${memberName(lastStandingUserId)}`)
  }
  if (explorerUserId && maxVenues > 1) {
    superlatives.push(`The Explorer: ${memberName(explorerUserId)} (${maxVenues} venues)`)
  }

  slides.push({
    id: 'slide-5',
    variant: 'stat-reveal',
    heading: "Tonight's Awards",
    subheading: superlatives.length > 0 ? superlatives[0] : 'Everyone was a winner tonight',
    value: superlatives.length > 1 ? superlatives[1] : undefined,
    backgroundGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  })

  slides.push({
    id: 'slide-6',
    variant: 'peak-moment',
    heading: 'See You Next Weekend',
    subheading: partyName,
    backgroundGradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  })

  void media // included for future use (media_ids stored in DB recap)
  return slides
}

function rowToRecap(row: RecapRow): Recap {
  return {
    id: row.id,
    partyId: row.party_id,
    date: row.generated_at,
    slides: row.slides,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchRecapsForUser(userId: string): Promise<Recap[]> {
  const client = getSupabaseClient()

  // Find all party IDs the user belongs to
  const { data: memberData, error: memberError } = await client
    .from('party_members')
    .select('party_id')
    .eq('user_id', userId)

  if (memberError) {
    throw new Error(`Failed to fetch user parties: ${memberError.message}`)
  }

  const partyIds = ((memberData ?? []) as Array<{ party_id: string }>).map((r) => r.party_id)

  if (partyIds.length === 0) return []

  const { data, error } = await client
    .from('recaps')
    .select('id, party_id, slides, media_ids, generated_at, parties(name, start_time, end_time)')
    .in('party_id', partyIds)
    .order('generated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch recaps: ${error.message}`)
  }

  return ((data ?? []) as unknown as RecapRow[]).map(rowToRecap)
}

export async function fetchRecap(recapId: string): Promise<Recap | null> {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('recaps')
    .select('id, party_id, slides, media_ids, generated_at, parties(name, start_time, end_time)')
    .eq('id', recapId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch recap: ${error.message}`)
  }

  if (!data) return null

  return rowToRecap(data as unknown as RecapRow)
}

/**
 * Client-side recap generation — used when the Edge Function is not deployed.
 * Queries Supabase directly from the browser and computes the same stats.
 */
export async function generateRecapLocally(partyId: string): Promise<Recap> {
  const client = getSupabaseClient()

  // Fetch party
  const { data: partyData, error: partyError } = await client
    .from('parties')
    .select('id, name, host_id, start_time, end_time, status')
    .eq('id', partyId)
    .single()

  if (partyError || !partyData) {
    throw new Error(`Party not found: ${partyError?.message ?? 'unknown'}`)
  }

  const party = partyData as { id: string; name: string; start_time: string; end_time: string | null }
  const endTime = party.end_time ?? new Date().toISOString()

  // Fetch members
  const { data: membersData, error: membersError } = await client
    .from('party_members')
    .select('user_id, done, profiles(name, avatar_url)')
    .eq('party_id', partyId)

  if (membersError) {
    throw new Error(`Failed to fetch members: ${membersError.message}`)
  }

  const members = (membersData ?? []) as unknown as PartyMemberRow[]
  const memberUserIds = members.map((m) => m.user_id)

  // Fetch consumption logs
  const { data: logsData, error: logsError } = await client
    .from('consumption_log')
    .select('id, user_id, party_id, drink_type, logged_at, catalog_item_id, estimated_alcohol_grams, abv, volume_ml, vessel_type, fill_level, image_url, is_manual_entry, ai_raw_response, user_corrections')
    .in('user_id', memberUserIds.length > 0 ? memberUserIds : ['__none__'])
    .eq('party_id', partyId)
    .gte('logged_at', party.start_time)
    .lte('logged_at', endTime)
    .order('logged_at', { ascending: true })

  if (logsError) {
    throw new Error(`Failed to fetch logs: ${logsError.message}`)
  }

  const logs = (logsData ?? []) as ConsumptionLogRow[]

  // Fetch catalog
  const catalogIds = [...new Set(logs.map((l) => l.catalog_item_id).filter(Boolean))] as string[]
  let catalog: DrinkCatalogRow[] = []
  if (catalogIds.length > 0) {
    const { data: catalogData } = await client
      .from('drink_catalog')
      .select('id, category')
      .in('id', catalogIds)
    catalog = (catalogData ?? []) as DrinkCatalogRow[]
  }

  // Fetch media
  const { data: mediaData } = await client
    .from('media')
    .select('id, user_id, party_id, type, storage_url, captured_at, metadata')
    .eq('party_id', partyId)
    .order('captured_at', { ascending: false })

  const media = (mediaData ?? []) as MediaRow[]

  // Fetch locations
  const { data: locationData } = await client
    .from('location_log')
    .select('id, user_id, party_id, lat, lng, venue_name, venue_place_id, logged_at')
    .in('user_id', memberUserIds.length > 0 ? memberUserIds : ['__none__'])
    .eq('party_id', partyId)
    .gte('logged_at', party.start_time)
    .lte('logged_at', endTime)

  const locations = (locationData ?? []) as LocationLogRow[]

  // Build slides
  const slides = buildSlidesLocally({
    partyName: party.name,
    startTime: party.start_time,
    endTime,
    members,
    logs,
    catalog,
    locations,
    media,
  })

  // Persist to DB
  const mediaIds = media.map((m) => m.id)
  const { data: recapData, error: recapError } = await client
    .from('recaps')
    .insert({
      party_id: partyId,
      slides,
      media_ids: mediaIds,
      generated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (recapError) {
    throw new Error(`Failed to save recap: ${recapError.message}`)
  }

  const row = recapData as { id: string; party_id: string; slides: RecapSlide[]; media_ids: string[]; generated_at: string }

  return {
    id: row.id,
    partyId: row.party_id,
    date: row.generated_at,
    slides: row.slides,
  }
}
