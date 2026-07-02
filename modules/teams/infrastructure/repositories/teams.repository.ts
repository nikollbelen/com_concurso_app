import { supabase } from '@/shared/infrastructure/supabase/client'
import type { Team } from '@/modules/teams/domain/entities/team'

interface TeamRow {
  id: number
  name: string
  points: number | null
  level: number | null
  next_level_points: number | null
  current_chapter_id: string | null
  missions_completed: number | null
}

/** Meta de puntos por defecto cuando el equipo aún no tiene `next_level_points`. */
const DEFAULT_NEXT_LEVEL_POINTS = 1500

/** Devuelve el equipo por id, o null si no existe. */
export async function getTeam(teamId: number): Promise<Team | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('teams')
    .select('id, name, points, level, next_level_points, current_chapter_id, missions_completed')
    .eq('id', teamId)
    .single()

  if (error || !data) return null

  const row = data as TeamRow
  return {
    id: row.id,
    name: row.name,
    points: row.points ?? 0,
    level: row.level ?? 1,
    nextLevelPoints: row.next_level_points ?? DEFAULT_NEXT_LEVEL_POINTS,
    currentChapterId: row.current_chapter_id,
    missionsCompleted: row.missions_completed ?? 0,
  }
}
