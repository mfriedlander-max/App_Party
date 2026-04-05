import { getSupabaseClient } from '@/lib/supabase'

export interface CorrectionLogRow {
  id: string
  consumption_log_id: string
  original_ai: Record<string, unknown>
  user_correction: Record<string, unknown>
  created_at: string
}

/**
 * Logs a user correction to the corrections_log table.
 * Called when the user edits any AI-identified field before confirming a drink.
 */
export async function logCorrection(
  consumptionLogId: string,
  originalAI: Record<string, unknown>,
  userCorrection: Record<string, unknown>,
): Promise<CorrectionLogRow> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('corrections_log')
    .insert({
      consumption_log_id: consumptionLogId,
      original_ai: originalAI,
      user_correction: userCorrection,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to log correction: ${error.message}`)
  }

  return data as CorrectionLogRow
}
