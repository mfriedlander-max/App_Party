import { getSupabaseClient } from '@/lib/supabase'

export interface DrinkCatalogRow {
  id: string
  name: string
  brand: string | null
  category: 'beer' | 'cocktail' | 'shot' | 'wine' | 'spirit' | 'other'
  emoji: string
  abv: number
  standard_volume_ml: number
  standard_drinks: number
  source: string | null
  image_url: string | null
  created_at: string
}

export interface ConsumptionLogRow {
  id: string
  user_id: string
  party_id: string | null
  catalog_item_id: string | null
  drink_type: string
  estimated_alcohol_grams: number
  abv: number | null
  volume_ml: number | null
  vessel_type: string | null
  fill_level: number | null
  image_url: string | null
  is_manual_entry: boolean
  ai_raw_response: unknown | null
  user_corrections: unknown | null
  logged_at: string
}

export interface LogDrinkParams {
  catalogItemId: string | null
  drinkType: string
  alcoholGrams: number
  abv: number | null
  volumeMl: number | null
  vesselType: string | null
  fillLevel: number
  isManualEntry: boolean
}

export async function fetchDrinkCatalog(): Promise<DrinkCatalogRow[]> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('drink_catalog')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch drink catalog: ${error.message}`)
  }

  return (data ?? []) as DrinkCatalogRow[]
}

export async function fetchDrinkLog(userId: string): Promise<ConsumptionLogRow[]> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('consumption_log')
    .select('*')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch drink log: ${error.message}`)
  }

  return (data ?? []) as ConsumptionLogRow[]
}

export async function logDrink(
  userId: string,
  params: LogDrinkParams,
): Promise<ConsumptionLogRow> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('consumption_log')
    .insert({
      user_id: userId,
      catalog_item_id: params.catalogItemId,
      drink_type: params.drinkType,
      estimated_alcohol_grams: params.alcoholGrams,
      abv: params.abv,
      volume_ml: params.volumeMl,
      vessel_type: params.vesselType,
      fill_level: params.fillLevel,
      is_manual_entry: params.isManualEntry,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to log drink: ${error.message}`)
  }

  return data as ConsumptionLogRow
}

export async function removeDrink(id: string): Promise<void> {
  const client = getSupabaseClient()
  const { error } = await client
    .from('consumption_log')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to remove drink: ${error.message}`)
  }
}
