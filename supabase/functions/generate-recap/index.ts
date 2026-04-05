// Deno Edge Function — generate-recap
// Generates a Spotify Wrapped-style recap for a completed party.
// Input: POST { partyId: string }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── DB row types ─────────────────────────────────────────────────────────────

interface PartyRow {
  id: string
  name: string
  host_id: string
  start_time: string
  end_time: string | null
  status: string
}

interface PartyMemberRow {
  party_id: string
  user_id: string
  role: string
  done: boolean
  profiles: { name: string; avatar_url: string | null } | null
}

interface ConsumptionLogRow {
  id: string
  user_id: string
  party_id: string | null
  drink_type: string
  logged_at: string
  catalog_item_id: string | null
}

interface DrinkCatalogRow {
  id: string
  category: string
}

interface LocationLogRow {
  user_id: string
  party_id: string | null
  venue_name: string | null
  logged_at: string
}

interface MediaRow {
  id: string
  party_id: string | null
  storage_url: string
  captured_at: string
}

// ─── Slide types ──────────────────────────────────────────────────────────────

type SlideVariant = 'stat-reveal' | 'group-photo' | 'drink-breakdown' | 'peak-moment'

interface RecapSlideData {
  id: string
  variant: SlideVariant
  heading: string
  subheading: string
  value?: string
  backgroundGradient: string
  drinkData?: Array<{ label: string; pct: number; color: string }>
  memberStats?: Array<{ userId: string; name: string; drinkCount: number }>
  mediaUrls?: string[]
}

// ─── Stat computation ─────────────────────────────────────────────────────────

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

// ─── Slide builders ───────────────────────────────────────────────────────────

function buildSlides(params: {
  party: PartyRow
  members: PartyMemberRow[]
  logs: ConsumptionLogRow[]
  catalog: DrinkCatalogRow[]
  locations: LocationLogRow[]
  media: MediaRow[]
}): RecapSlideData[] {
  const { party, members, logs, catalog, locations, media } = params
  const endTime = party.end_time ?? new Date().toISOString()
  const duration = formatDuration(party.start_time, endTime)

  const totalDrinks = logs.length

  // Per-person drink counts
  const drinksByUser = new Map<string, number>()
  for (const log of logs) {
    drinksByUser.set(log.user_id, (drinksByUser.get(log.user_id) ?? 0) + 1)
  }

  // Unique venues from location log
  const venueSet = new Set<string>()
  for (const loc of locations) {
    if (loc.venue_name) venueSet.add(loc.venue_name)
  }
  const venueCount = venueSet.size

  const peakHour = computePeakHour(logs)
  const drinkBreakdown = computeDrinkBreakdown(logs, catalog)

  // Superlatives
  let mostDrinksUserId = ''
  let mostDrinksCount = 0
  for (const [uid, count] of drinksByUser) {
    if (count > mostDrinksCount) {
      mostDrinksCount = count
      mostDrinksUserId = uid
    }
  }

  // Last one standing — user with the latest logged drink
  let lastStandingUserId = ''
  let lastDrinkTime = 0
  for (const log of logs) {
    const t = new Date(log.logged_at).getTime()
    if (t > lastDrinkTime) {
      lastDrinkTime = t
      lastStandingUserId = log.user_id
    }
  }

  // The Explorer — user with most unique venues
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

  const memberStats = members.map((m) => ({
    userId: m.user_id,
    name: m.profiles?.name ?? 'Member',
    drinkCount: drinksByUser.get(m.user_id) ?? 0,
  }))

  const mediaUrls = media.map((m) => m.storage_url)

  const slides: RecapSlideData[] = []

  // Slide 1 — Your night in numbers
  const venueText = venueCount > 0 ? `, ${venueCount} venue${venueCount !== 1 ? 's' : ''}` : ''
  slides.push({
    id: 'slide-1',
    variant: 'stat-reveal',
    heading: 'Your Night in Numbers',
    subheading: `${duration}${venueText} · ${members.length} people`,
    value: `${totalDrinks} drinks`,
    backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  })

  // Slide 2 — Drink breakdown
  slides.push({
    id: 'slide-2',
    variant: 'drink-breakdown',
    heading: 'Drinks Were Flowing',
    subheading: drinkBreakdown.length > 0
      ? `${drinkBreakdown[0].label}s led the night`
      : 'Here is what the crew consumed',
    value: `${totalDrinks} total drinks`,
    backgroundGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    drinkData: drinkBreakdown,
  })

  // Slide 3 — Peak moment
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

  // Slide 4 — The crew (group photo)
  slides.push({
    id: 'slide-4',
    variant: 'group-photo',
    heading: 'The Crew',
    subheading: `${members.length} people, one legendary night`,
    backgroundGradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    memberStats,
    mediaUrls: mediaUrls.slice(0, 3),
  })

  // Slide 5 — Superlatives
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
    heading: 'Tonight\'s Awards',
    subheading: superlatives.length > 0 ? superlatives[0] : 'Everyone was a winner tonight',
    value: superlatives.length > 1 ? superlatives[1] : undefined,
    backgroundGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  })

  // Slide 6 — Closing
  slides.push({
    id: 'slide-6',
    variant: 'peak-moment',
    heading: 'See You Next Weekend',
    subheading: 'Until next time 🥂',
    backgroundGradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  })

  return slides
}

// ─── Handler ──────────────────────────────────────────────────────────────────

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

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: 'Supabase credentials not configured' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  let body: { partyId: string }
  try {
    body = await req.json() as { partyId: string }
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  if (!body.partyId) {
    return new Response(
      JSON.stringify({ error: 'partyId is required' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  const { partyId } = body
  const client = createClient(supabaseUrl, supabaseServiceKey)

  // 1. Fetch party details
  const { data: partyData, error: partyError } = await client
    .from('parties')
    .select('id, name, host_id, start_time, end_time, status')
    .eq('id', partyId)
    .single()

  if (partyError || !partyData) {
    return new Response(
      JSON.stringify({ error: `Party not found: ${partyError?.message ?? 'unknown'}` }),
      { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  const party = partyData as PartyRow
  const endTime = party.end_time ?? new Date().toISOString()

  // 2. Fetch members with profile data
  const { data: membersData, error: membersError } = await client
    .from('party_members')
    .select('party_id, user_id, role, done, profiles(name, avatar_url)')
    .eq('party_id', partyId)

  if (membersError) {
    return new Response(
      JSON.stringify({ error: `Failed to fetch members: ${membersError.message}` }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  const members = (membersData ?? []) as unknown as PartyMemberRow[]
  const memberUserIds = members.map((m) => m.user_id)

  // 3. Fetch consumption log for party members during party timeframe
  const { data: logsData, error: logsError } = await client
    .from('consumption_log')
    .select('id, user_id, party_id, drink_type, logged_at, catalog_item_id')
    .in('user_id', memberUserIds.length > 0 ? memberUserIds : ['__none__'])
    .eq('party_id', partyId)
    .gte('logged_at', party.start_time)
    .lte('logged_at', endTime)
    .order('logged_at', { ascending: true })

  if (logsError) {
    return new Response(
      JSON.stringify({ error: `Failed to fetch consumption logs: ${logsError.message}` }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  const logs = (logsData ?? []) as ConsumptionLogRow[]

  // 4. Fetch catalog items referenced in logs (for category info)
  const catalogIds = [...new Set(logs.map((l) => l.catalog_item_id).filter(Boolean))] as string[]
  let catalog: DrinkCatalogRow[] = []

  if (catalogIds.length > 0) {
    const { data: catalogData } = await client
      .from('drink_catalog')
      .select('id, category')
      .in('id', catalogIds)
    catalog = (catalogData ?? []) as DrinkCatalogRow[]
  }

  // 5. Fetch media for party
  const { data: mediaData } = await client
    .from('media')
    .select('id, party_id, storage_url, captured_at')
    .eq('party_id', partyId)
    .order('captured_at', { ascending: false })

  const media = (mediaData ?? []) as MediaRow[]

  // 6. Fetch location log for party members during party timeframe
  const { data: locationData } = await client
    .from('location_log')
    .select('user_id, party_id, venue_name, logged_at')
    .in('user_id', memberUserIds.length > 0 ? memberUserIds : ['__none__'])
    .eq('party_id', partyId)
    .gte('logged_at', party.start_time)
    .lte('logged_at', endTime)

  const locations = (locationData ?? []) as LocationLogRow[]

  // 7. Build slides
  const slides = buildSlides({ party, members, logs, catalog, locations, media })

  // 8. Insert recap into recaps table
  const mediaIds = media.map((m) => m.id)

  const { data: recapData, error: recapError } = await client
    .from('recaps')
    .insert({
      party_id: partyId,
      slides: slides,
      media_ids: mediaIds,
      generated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (recapError) {
    return new Response(
      JSON.stringify({ error: `Failed to save recap: ${recapError.message}` }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  return new Response(
    JSON.stringify({ success: true, recap: recapData }),
    { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
  )
})
