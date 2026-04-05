import { getSupabaseClient } from '@/lib/supabase'
import { generateInviteCode } from '@/utils/invite-code'
import type { Party, PartyMember } from '@/types/party'

interface PartyRow {
  id: string
  name: string
  host_id: string
  invite_code: string
  location_name: string
  start_time: string
  end_time: string | null
  status: 'upcoming' | 'active' | 'ended'
  created_at: string
}

interface PartyMemberRow {
  party_id: string
  user_id: string
  role: 'host' | 'member'
  joined_at: string
  done: boolean
}

interface PartyMemberWithProfile extends PartyMemberRow {
  profiles: {
    name: string
    avatar_url: string
  } | null
}

function rowToParty(row: PartyRow, members?: PartyMember[]): Party {
  return {
    id: row.id,
    name: row.name,
    hostId: row.host_id,
    inviteCode: row.invite_code,
    locationName: row.location_name,
    startTime: row.start_time,
    status: row.status,
    members,
  }
}

function memberRowToPartyMember(row: PartyMemberWithProfile): PartyMember {
  return {
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
    done: row.done,
    name: row.profiles?.name,
    avatarSeed: row.profiles?.name,
  }
}

export async function createParty(
  hostId: string,
  name: string,
  location: string,
  memberIds: string[],
): Promise<Party> {
  const client = getSupabaseClient()
  const inviteCode = generateInviteCode()

  const { data: partyData, error: partyError } = await client
    .from('parties')
    .insert({
      name,
      host_id: hostId,
      invite_code: inviteCode,
      location_name: location,
      status: 'active',
    })
    .select()
    .single()

  if (partyError) {
    throw new Error(`Failed to create party: ${partyError.message}`)
  }

  const row = partyData as PartyRow

  // Insert host + members in one batch
  const memberInserts = [
    { party_id: row.id, user_id: hostId, role: 'host' as const },
    ...memberIds.map((uid) => ({ party_id: row.id, user_id: uid, role: 'member' as const })),
  ]

  const { error: memberError } = await client.from('party_members').insert(memberInserts)

  if (memberError) {
    throw new Error(`Failed to add party members: ${memberError.message}`)
  }

  return rowToParty(row)
}

export async function fetchActiveParty(userId: string): Promise<Party | null> {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('party_members')
    .select('party_id, parties!inner(id, name, host_id, invite_code, location_name, start_time, end_time, status, created_at)')
    .eq('user_id', userId)
    .eq('parties.status', 'active')
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch active party: ${error.message}`)
  }

  if (!data) return null

  const partyRow = (data as unknown as { parties: PartyRow }).parties
  return rowToParty(partyRow)
}

export async function fetchPastParties(userId: string): Promise<Party[]> {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('party_members')
    .select('party_id, parties!inner(id, name, host_id, invite_code, location_name, start_time, end_time, status, created_at)')
    .eq('user_id', userId)
    .eq('parties.status', 'ended')
    .order('party_id', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch past parties: ${error.message}`)
  }

  return ((data ?? []) as unknown as Array<{ parties: PartyRow }>).map((d) => rowToParty(d.parties))
}

export async function joinParty(userId: string, inviteCode: string): Promise<Party> {
  const client = getSupabaseClient()

  const { data: partyData, error: partyError } = await client
    .from('parties')
    .select('*')
    .eq('invite_code', inviteCode)
    .eq('status', 'active')
    .single()

  if (partyError || !partyData) {
    throw new Error('Party not found or no longer active')
  }

  const row = partyData as PartyRow

  const { error: memberError } = await client
    .from('party_members')
    .insert({ party_id: row.id, user_id: userId, role: 'member' })

  if (memberError) {
    // Ignore duplicate member error (user already in party)
    if (!memberError.message.includes('duplicate') && !memberError.code?.includes('23505')) {
      throw new Error(`Failed to join party: ${memberError.message}`)
    }
  }

  return rowToParty(row)
}

export async function leaveParty(userId: string, partyId: string): Promise<void> {
  const client = getSupabaseClient()

  const { error } = await client
    .from('party_members')
    .delete()
    .eq('user_id', userId)
    .eq('party_id', partyId)

  if (error) {
    throw new Error(`Failed to leave party: ${error.message}`)
  }
}

export async function endParty(partyId: string): Promise<void> {
  const client = getSupabaseClient()

  const { error } = await client
    .from('parties')
    .update({ status: 'ended', end_time: new Date().toISOString() })
    .eq('id', partyId)

  if (error) {
    throw new Error(`Failed to end party: ${error.message}`)
  }
}

export async function fetchPartyMembers(partyId: string): Promise<PartyMember[]> {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('party_members')
    .select('party_id, user_id, role, joined_at, done, profiles(name, avatar_url)')
    .eq('party_id', partyId)
    .order('joined_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch party members: ${error.message}`)
  }

  return ((data ?? []) as unknown as PartyMemberWithProfile[]).map(memberRowToPartyMember)
}

export async function markDone(userId: string, partyId: string): Promise<void> {
  const client = getSupabaseClient()

  const { error } = await client
    .from('party_members')
    .update({ done: true })
    .eq('user_id', userId)
    .eq('party_id', partyId)

  if (error) {
    throw new Error(`Failed to mark done: ${error.message}`)
  }
}
