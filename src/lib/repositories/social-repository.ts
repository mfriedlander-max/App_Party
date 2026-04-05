import { getSupabaseClient } from '@/lib/supabase'
import type { SocialFeedItem } from './media-repository'

export async function fetchSocialFeed(userId: string): Promise<SocialFeedItem[]> {
  const client = getSupabaseClient()

  // Get friend IDs (both directions)
  const { data: friendships, error: friendError } = await client
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

  if (friendError) {
    throw new Error(`Failed to fetch friendships: ${friendError.message}`)
  }

  const friendIds = ((friendships ?? []) as Array<{ requester_id: string; addressee_id: string }>)
    .map((row) => (row.requester_id === userId ? row.addressee_id : row.requester_id))

  if (friendIds.length === 0) {
    return []
  }

  const { data, error } = await client
    .from('social_feed')
    .select('*')
    .in('user_id', friendIds)
    .order('captured_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch social feed: ${error.message}`)
  }

  return (data ?? []) as SocialFeedItem[]
}

export async function fetchPartyFeed(partyId: string): Promise<SocialFeedItem[]> {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('social_feed')
    .select('*')
    .eq('party_id', partyId)
    .order('captured_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch party feed: ${error.message}`)
  }

  return (data ?? []) as SocialFeedItem[]
}

/**
 * V1: like count is managed in local state only — no likes table yet.
 * This function is a no-op placeholder for future persistence.
 */
export function likePost(_userId: string, _mediaId: string): void {
  // Future: persist to a likes table
}
