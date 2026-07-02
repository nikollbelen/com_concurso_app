import { supabase } from '@/shared/infrastructure/supabase/client'
import type { SchoolRanking } from '@/modules/schools/domain/entities/school'

interface SchoolRow {
  id: string
  name: string
  short: string | null
  color: string | null
  points: number | null
  missions_completed: number | null
  teams: { id: number }[] | null
}

/**
 * Ranking de colegios ordenado por puntos (desc). La posición se calcula
 * a partir del orden. `totalTeams` sale del conteo de equipos anidados.
 */
export async function getSchoolRanking(): Promise<SchoolRanking[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('schools')
    .select('id, name, short, color, points, missions_completed, teams ( id )')
    .order('points', { ascending: false })

  if (error) throw new Error(`getSchoolRanking: ${error.message}`)

  return ((data ?? []) as SchoolRow[]).map((row, index) => ({
    id: row.id,
    name: row.name,
    short: row.short ?? row.name,
    color: row.color ?? '#7C3AED',
    points: row.points ?? 0,
    missionsCompleted: row.missions_completed ?? 0,
    totalTeams: Array.isArray(row.teams) ? row.teams.length : 0,
    rankingPosition: index + 1,
  }))
}
