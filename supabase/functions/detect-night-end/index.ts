// Deno Edge Function — detect-night-end
// Designed to run as a cron job every 15 minutes between midnight and 6am.
// Ends active parties based on three signals (no geolocation — web limitation).

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Signal thresholds in milliseconds
const INACTIVITY_THRESHOLD_MS = 90 * 60 * 1000  // 90 minutes
const TIME_HEURISTIC_THRESHOLD_MS = 60 * 60 * 1000  // 60 minutes
const LATE_NIGHT_HOUR = 4  // 4am

interface PartyRow {
  id: string
  name: string
  host_id: string
  start_time: string
  status: 'upcoming' | 'active' | 'ended'
}

interface ConsumptionLogRow {
  party_id: string
  logged_at: string
}

interface PartyMemberRow {
  party_id: string
  user_id: string
  done: boolean
}

interface EndReason {
  partyId: string
  reason: 'all_members_done' | 'inactivity' | 'time_heuristic'
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: 'Supabase credentials not configured' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  const client = createClient(supabaseUrl, supabaseServiceKey)
  const now = new Date()

  // Fetch all active parties
  const { data: partiesData, error: partiesError } = await client
    .from('parties')
    .select('id, name, host_id, start_time, status')
    .eq('status', 'active')

  if (partiesError) {
    return new Response(
      JSON.stringify({ error: `Failed to fetch active parties: ${partiesError.message}` }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  const activeParties = (partiesData ?? []) as PartyRow[]

  if (activeParties.length === 0) {
    return new Response(
      JSON.stringify({ processed: 0, ended: [] }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  const partyIds = activeParties.map((p) => p.id)

  // Fetch all party members for active parties
  const { data: membersData, error: membersError } = await client
    .from('party_members')
    .select('party_id, user_id, done')
    .in('party_id', partyIds)

  if (membersError) {
    return new Response(
      JSON.stringify({ error: `Failed to fetch party members: ${membersError.message}` }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  const allMembers = (membersData ?? []) as PartyMemberRow[]

  // Fetch last consumption log per party (most recent drink by any member)
  const { data: logsData, error: logsError } = await client
    .from('consumption_log')
    .select('party_id, logged_at')
    .in('party_id', partyIds)
    .order('logged_at', { ascending: false })

  if (logsError) {
    return new Response(
      JSON.stringify({ error: `Failed to fetch consumption logs: ${logsError.message}` }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  const allLogs = (logsData ?? []) as ConsumptionLogRow[]

  // Build lookup: partyId → last drink time
  const lastDrinkByParty = new Map<string, Date>()
  for (const log of allLogs) {
    if (!lastDrinkByParty.has(log.party_id)) {
      lastDrinkByParty.set(log.party_id, new Date(log.logged_at))
    }
  }

  // Build lookup: partyId → members[]
  const membersByParty = new Map<string, PartyMemberRow[]>()
  for (const member of allMembers) {
    const existing = membersByParty.get(member.party_id) ?? []
    membersByParty.set(member.party_id, [...existing, member])
  }

  const toEnd: EndReason[] = []

  for (const party of activeParties) {
    const members = membersByParty.get(party.id) ?? []
    const lastDrink = lastDrinkByParty.get(party.id)
    const partyStart = new Date(party.start_time)

    // Signal 1: All members done
    if (members.length > 0 && members.every((m) => m.done)) {
      toEnd.push({ partyId: party.id, reason: 'all_members_done' })
      continue
    }

    // Signal 2: Consumption inactivity — no drink logged by ANY member in > 90 min
    if (lastDrink && now.getTime() - lastDrink.getTime() > INACTIVITY_THRESHOLD_MS) {
      toEnd.push({ partyId: party.id, reason: 'inactivity' })
      continue
    }

    // Signal 3: Time heuristic — party started before midnight, now after 4am,
    // and no activity in the last 60 minutes
    const midnight = new Date(now)
    midnight.setHours(0, 0, 0, 0)
    const startedBeforeMidnight = partyStart < midnight
    const nowAfter4am = now.getHours() >= LATE_NIGHT_HOUR

    if (startedBeforeMidnight && nowAfter4am) {
      const lastActivity = lastDrink ?? partyStart
      if (now.getTime() - lastActivity.getTime() > TIME_HEURISTIC_THRESHOLD_MS) {
        toEnd.push({ partyId: party.id, reason: 'time_heuristic' })
        continue
      }
    }
  }

  if (toEnd.length === 0) {
    return new Response(
      JSON.stringify({ processed: activeParties.length, ended: [] }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  // End all qualifying parties
  const endTime = now.toISOString()
  const partiesToEnd = toEnd.map((e) => e.partyId)

  const { error: updateError } = await client
    .from('parties')
    .update({ status: 'ended', end_time: endTime })
    .in('id', partiesToEnd)

  if (updateError) {
    return new Response(
      JSON.stringify({ error: `Failed to end parties: ${updateError.message}` }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  // Trigger recap generation for each ended party (best-effort, non-blocking)
  const recapBaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  await Promise.allSettled(
    partiesToEnd.map(async (partyId) => {
      try {
        await fetch(`${recapBaseUrl}/functions/v1/generate-recap`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ partyId }),
        })
      } catch {
        // Best-effort — failures are silently ignored so night-end still succeeds
      }
    }),
  )

  return new Response(
    JSON.stringify({
      processed: activeParties.length,
      ended: toEnd.map((e) => ({ partyId: e.partyId, reason: e.reason })),
    }),
    { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
  )
})
