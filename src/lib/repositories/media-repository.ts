import { getSupabaseClient } from '@/lib/supabase'

export type MediaType = 'drink_scan' | 'in_app_capture' | 'camera_roll_sync'

export interface MediaRow {
  id: string
  user_id: string
  party_id: string | null
  type: MediaType
  storage_url: string
  captured_at: string
  metadata: Record<string, unknown> | null
}

export interface SocialFeedItem extends MediaRow {
  user_name: string
  user_avatar: string | null
}

/**
 * Resize an image file on a canvas to max 1200px wide, returns a Blob.
 */
async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const MAX_WIDTH = 1200
      const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'))
        return
      }
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob returned null'))
            return
          }
          resolve(blob)
        },
        'image/jpeg',
        0.85,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image for resizing'))
    }
    img.src = objectUrl
  })
}

export async function uploadMedia(
  userId: string,
  partyId: string | null,
  file: File,
  type: MediaType,
): Promise<MediaRow> {
  const client = getSupabaseClient()

  const resized = await resizeImage(file)
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${userId}/${timestamp}_${safeName}`

  const { error: uploadError } = await client.storage
    .from('party-media')
    .upload(storagePath, resized, { contentType: 'image/jpeg', upsert: false })

  if (uploadError) {
    throw new Error(`Failed to upload media: ${uploadError.message}`)
  }

  const { data: urlData } = client.storage
    .from('party-media')
    .getPublicUrl(storagePath)

  const storageUrl = urlData.publicUrl

  const { data, error: insertError } = await client
    .from('media')
    .insert({
      user_id: userId,
      party_id: partyId,
      type,
      storage_url: storageUrl,
      captured_at: new Date().toISOString(),
      metadata: null,
    })
    .select()
    .single()

  if (insertError) {
    throw new Error(`Failed to insert media record: ${insertError.message}`)
  }

  return data as MediaRow
}

export async function fetchMediaForParty(partyId: string): Promise<MediaRow[]> {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('media')
    .select('*')
    .eq('party_id', partyId)
    .order('captured_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch party media: ${error.message}`)
  }

  return (data ?? []) as MediaRow[]
}

export async function fetchMediaForUser(userId: string): Promise<MediaRow[]> {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('media')
    .select('*')
    .eq('user_id', userId)
    .order('captured_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch user media: ${error.message}`)
  }

  return (data ?? []) as MediaRow[]
}

export async function deleteMedia(id: string): Promise<void> {
  const client = getSupabaseClient()

  // Fetch the record first to get the storage path
  const { data: existing, error: fetchError } = await client
    .from('media')
    .select('storage_url')
    .eq('id', id)
    .single()

  if (fetchError) {
    throw new Error(`Failed to find media record: ${fetchError.message}`)
  }

  // Extract storage path from public URL
  // URL format: .../storage/v1/object/public/party-media/{userId}/{file}
  const url: string = (existing as { storage_url: string }).storage_url
  const marker = '/party-media/'
  const markerIndex = url.indexOf(marker)
  if (markerIndex !== -1) {
    const storagePath = url.slice(markerIndex + marker.length)
    await client.storage.from('party-media').remove([storagePath])
  }

  const { error: deleteError } = await client.from('media').delete().eq('id', id)

  if (deleteError) {
    throw new Error(`Failed to delete media record: ${deleteError.message}`)
  }
}
