import { useEffect, useRef, useState } from 'react'
import { logLocation } from '@/lib/repositories/location-repository'
import { matchVenue } from '@/lib/services/venue-service'
import { updateVenueInfo } from '@/lib/repositories/location-repository'

const LOG_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

export interface TrackedPosition {
  readonly lat: number
  readonly lng: number
  readonly timestamp: number
}

interface UseLocationTrackerOptions {
  readonly userId: string | null
  readonly partyId: string | null
  /** Set to true when user is in an active party */
  readonly active: boolean
}

interface UseLocationTrackerResult {
  readonly lastPosition: TrackedPosition | null
  readonly permissionDenied: boolean
}

/**
 * Tracks user location via browser geolocation while in an active party.
 * Logs to Supabase at most once every 5 minutes.
 * Stops automatically when the party ends or the user leaves.
 * Gracefully handles geolocation permission denial.
 */
export function useLocationTracker({
  userId,
  partyId,
  active,
}: UseLocationTrackerOptions): UseLocationTrackerResult {
  const [lastPosition, setLastPosition] = useState<TrackedPosition | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const watchIdRef = useRef<number | null>(null)
  const lastLoggedAtRef = useRef<number>(0)

  useEffect(() => {
    if (!active || !userId || typeof navigator === 'undefined' || !navigator.geolocation) {
      return
    }

    const handlePosition = (pos: GeolocationPosition): void => {
      const { latitude: lat, longitude: lng } = pos.coords
      const now = Date.now()

      setLastPosition({ lat, lng, timestamp: now })

      // Rate-limit: only log once every LOG_INTERVAL_MS
      if (now - lastLoggedAtRef.current < LOG_INTERVAL_MS) return
      lastLoggedAtRef.current = now

      // Fire-and-forget: persist location, then try to enrich with venue
      logLocation(userId, partyId, lat, lng)
        .then((row) => {
          matchVenue(lat, lng).then((venue) => {
            if (venue) {
              updateVenueInfo(row.id, venue.name, venue.placeId).catch(() => {
                // Venue enrichment is best-effort
              })
            }
          }).catch(() => {
            // Venue lookup failure is non-fatal
          })
        })
        .catch(() => {
          // Location persistence failure is non-fatal — app continues working
        })
    }

    const handleError = (err: GeolocationPositionError): void => {
      if (err.code === err.PERMISSION_DENIED) {
        setPermissionDenied(true)
      }
      // POSITION_UNAVAILABLE and TIMEOUT are transient — keep watching
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: false,
        timeout: 15_000,
        maximumAge: 60_000,
      },
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [active, userId, partyId])

  return { lastPosition, permissionDenied }
}
