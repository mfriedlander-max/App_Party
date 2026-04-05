import { getSupabaseClient } from '@/lib/supabase'

export interface FriendshipRow {
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
  updated_at: string
}

export interface FriendProfile {
  userId: string
  name: string
  avatarSeed: string
  xp: number
  level: number
}

export interface FriendRequest {
  requesterId: string
  name: string
  avatarSeed: string
  createdAt: string
}

interface ProfileRow {
  id: string
  name: string
  avatar_url: string
  xp: number
  level: number
}

function profileToFriendProfile(profile: ProfileRow): FriendProfile {
  return {
    userId: profile.id,
    name: profile.name,
    avatarSeed: profile.name,
    xp: profile.xp,
    level: profile.level,
  }
}

export async function sendFriendRequest(
  requesterId: string,
  addresseeId: string,
): Promise<void> {
  const client = getSupabaseClient()

  const { error } = await client
    .from('friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' })

  if (error) {
    throw new Error(`Failed to send friend request: ${error.message}`)
  }
}

export async function acceptFriendRequest(
  requesterId: string,
  addresseeId: string,
): Promise<void> {
  const client = getSupabaseClient()

  const { error } = await client
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('requester_id', requesterId)
    .eq('addressee_id', addresseeId)

  if (error) {
    throw new Error(`Failed to accept friend request: ${error.message}`)
  }
}

export async function blockUser(userId: string, blockedId: string): Promise<void> {
  const client = getSupabaseClient()

  // Upsert: update existing row or insert new blocked record
  const { error } = await client
    .from('friendships')
    .upsert(
      { requester_id: userId, addressee_id: blockedId, status: 'blocked' },
      { onConflict: 'requester_id,addressee_id' },
    )

  if (error) {
    throw new Error(`Failed to block user: ${error.message}`)
  }
}

export async function removeFriend(userId1: string, userId2: string): Promise<void> {
  const client = getSupabaseClient()

  // Delete in both directions
  const { error } = await client
    .from('friendships')
    .delete()
    .or(
      `and(requester_id.eq.${userId1},addressee_id.eq.${userId2}),and(requester_id.eq.${userId2},addressee_id.eq.${userId1})`,
    )

  if (error) {
    throw new Error(`Failed to remove friend: ${error.message}`)
  }
}

export async function fetchFriends(userId: string): Promise<FriendProfile[]> {
  const client = getSupabaseClient()

  // Fetch friendships where this user is requester or addressee and status=accepted
  const { data, error } = await client
    .from('friendships')
    .select('requester_id, addressee_id, profiles!friendships_requester_id_fkey(id, name, avatar_url, xp, level)')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

  if (error) {
    throw new Error(`Failed to fetch friends: ${error.message}`)
  }

  // For each friendship, pick the other user's profile
  const results: FriendProfile[] = []
  for (const row of data ?? []) {
    const r = row as unknown as {
      requester_id: string
      addressee_id: string
      profiles: ProfileRow | null
    }
    // We need both profiles — do a separate fetch for the friend's profile
    const friendId = r.requester_id === userId ? r.addressee_id : r.requester_id
    const { data: profileData } = await client
      .from('profiles')
      .select('id, name, avatar_url, xp, level')
      .eq('id', friendId)
      .single()
    if (profileData) {
      results.push(profileToFriendProfile(profileData as ProfileRow))
    }
  }

  return results
}

export async function fetchPendingRequests(userId: string): Promise<FriendRequest[]> {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('friendships')
    .select('requester_id, created_at, profiles!friendships_requester_id_fkey(name, avatar_url)')
    .eq('addressee_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch pending requests: ${error.message}`)
  }

  return ((data ?? []) as unknown as Array<{
    requester_id: string
    created_at: string
    profiles: { name: string; avatar_url: string } | null
  }>).map((row) => ({
    requesterId: row.requester_id,
    name: row.profiles?.name ?? 'Unknown',
    avatarSeed: row.profiles?.name ?? row.requester_id,
    createdAt: row.created_at,
  }))
}

export async function searchUsers(query: string): Promise<FriendProfile[]> {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('profiles')
    .select('id, name, avatar_url, xp, level')
    .ilike('name', `%${query}%`)
    .limit(20)

  if (error) {
    throw new Error(`Failed to search users: ${error.message}`)
  }

  return ((data ?? []) as ProfileRow[]).map(profileToFriendProfile)
}
