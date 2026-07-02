import { supabase } from '@/shared/infrastructure/supabase/client'

interface ProgressRow {
  mission_id: string
  status: string
}

/**
 * Progreso de misiones de un equipo, como mapa `{ missionId: status }`.
 * Si el equipo no tiene filas (juego recién empezado) devuelve un objeto vacío.
 */
export async function getTeamProgress(teamId: number): Promise<Record<string, string>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('mission_progression')
    .select('mission_id, status')
    .eq('team_id', teamId)

  if (error) throw new Error(`getTeamProgress: ${error.message}`)

  const map: Record<string, string> = {}
  for (const row of (data ?? []) as ProgressRow[]) {
    map[row.mission_id] = row.status
  }
  return map
}
