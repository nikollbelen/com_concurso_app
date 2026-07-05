import { supabase } from '@/shared/infrastructure/supabase/client'

/** Radio (metros) por defecto si la BD aún no responde o el valor es inválido. */
export const DEFAULT_ARRIVAL_RADIUS_M = 20

const ARRIVAL_RADIUS_KEY = 'arrival_radius_m'

/** Lee el radio de llegada (geofence) configurado por el admin. */
export async function getArrivalRadius(): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('app_settings')
    .select('value')
    .eq('key', ARRIVAL_RADIUS_KEY)
    .maybeSingle()

  if (error) throw new Error(`getArrivalRadius: ${error.message}`)

  const v = Number(data?.value)
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_ARRIVAL_RADIUS_M
}

/** Guarda el radio de llegada (solo admin, según RLS). */
export async function setArrivalRadius(meters: number): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('app_settings')
    .upsert(
      { key: ARRIVAL_RADIUS_KEY, value: meters, updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    )

  if (error) throw new Error(`setArrivalRadius: ${error.message}`)
}
