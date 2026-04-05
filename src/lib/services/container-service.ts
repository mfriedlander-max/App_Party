import { getSupabaseClient } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ContainerRow {
  id: string
  name: string
  category: 'can' | 'bottle' | 'glass' | 'cup' | 'other'
  volume_ml: number
  typical_fill: number
  icon: string
}

export interface ContainerVolume {
  volumeMl: number
  typicalFill: number
}

export interface AlcoholContent {
  alcoholGrams: number
  standardDrinks: number
}

// ─── In-memory cache ─────────────────────────────────────────────────────────

let containerCache: ContainerRow[] | null = null

async function getContainers(): Promise<ContainerRow[]> {
  if (containerCache !== null) return containerCache

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('containers')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch containers: ${error.message}`)
  }

  containerCache = (data ?? []) as ContainerRow[]
  return containerCache
}

// Exported for testing — allows cache to be cleared between tests
export function clearContainerCache(): void {
  containerCache = null
}

// ─── Fallback map for offline/test use ───────────────────────────────────────

const FALLBACK_VOLUMES: Record<string, ContainerVolume> = {
  'pint glass':       { volumeMl: 473, typicalFill: 0.90 },
  'wine glass':       { volumeMl: 148, typicalFill: 0.75 },
  'shot glass':       { volumeMl: 44,  typicalFill: 1.00 },
  'solo cup':         { volumeMl: 473, typicalFill: 0.75 },
  'can':              { volumeMl: 355, typicalFill: 1.00 },
  'bottle':           { volumeMl: 355, typicalFill: 1.00 },
  'rocks glass':      { volumeMl: 177, typicalFill: 0.85 },
  'highball glass':   { volumeMl: 355, typicalFill: 0.85 },
  'martini glass':    { volumeMl: 148, typicalFill: 0.90 },
  'champagne flute':  { volumeMl: 148, typicalFill: 0.80 },
  'standard can':     { volumeMl: 355, typicalFill: 1.00 },
  'tall can':         { volumeMl: 473, typicalFill: 1.00 },
  'hard seltzer can': { volumeMl: 355, typicalFill: 1.00 },
}

function matchFallback(vesselType: string): ContainerVolume {
  const lower = vesselType.toLowerCase()
  for (const [key, val] of Object.entries(FALLBACK_VOLUMES)) {
    if (lower.includes(key)) return val
  }
  return { volumeMl: 355, typicalFill: 1.00 }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Look up container volume by vessel/container name.
 * Queries the containers table (cached after first fetch).
 * Falls back to a hardcoded map if Supabase is unavailable.
 */
export async function getContainerVolume(vesselType: string): Promise<ContainerVolume> {
  const lower = vesselType.toLowerCase()

  try {
    const containers = await getContainers()
    const match = containers.find((c) => c.name.toLowerCase().includes(lower) || lower.includes(c.name.toLowerCase()))
    if (match) {
      return { volumeMl: match.volume_ml, typicalFill: match.typical_fill }
    }
  } catch {
    // Fall through to hardcoded fallback
  }

  return matchFallback(lower)
}

/**
 * Synchronous version using the fallback map only.
 * Useful when Supabase is unavailable (e.g. Edge Function boot, tests).
 */
export function getContainerVolumeSync(vesselType: string): ContainerVolume {
  return matchFallback(vesselType.toLowerCase())
}

/**
 * Estimate alcohol content from ABV, volume, and fill level.
 * @param abv - alcohol by volume as a decimal (e.g. 0.05 for 5%)
 * @param volumeMl - container volume in mL
 * @param fillLevel - how full the container is (0.0–1.0)
 */
export function estimateAlcoholContent(
  abv: number,
  volumeMl: number,
  fillLevel: number,
): AlcoholContent {
  const alcoholMl = volumeMl * fillLevel * abv
  const alcoholGrams = alcoholMl * 0.789
  const standardDrinks = parseFloat((alcoholGrams / 14).toFixed(2))
  return { alcoholGrams: parseFloat(alcoholGrams.toFixed(3)), standardDrinks }
}
