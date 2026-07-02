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

  // El puesto se asigna SOLO a colegios con puntos > 0 (los demás quedan sin puesto)
  let rank = 0
  return ((data ?? []) as SchoolRow[]).map((row) => {
    const points = row.points ?? 0
    return {
      id: row.id,
      name: row.name,
      short: row.short ?? row.name,
      color: row.color ?? '#7C3AED',
      points,
      missionsCompleted: row.missions_completed ?? 0,
      totalTeams: Array.isArray(row.teams) ? row.teams.length : 0,
      rankingPosition: points > 0 ? ++rank : null,
    }
  })
}

/* ─────────────────────────────────────────────────────────────
 * Detalle de colegios con sus equipos y miembros (paneles admin/director)
 * ───────────────────────────────────────────────────────────── */

const DIRECTOR_ROLE = '33333333-3333-3333-3333-333333333333'

const LEVEL_TITLES: Record<number, string> = {
  1: 'Iniciado',
  2: 'Explorador Histórico',
  3: 'Guardián Novato',
  4: 'Guardián Valiente',
  5: 'Guardián Maestro',
}

export interface SchoolTeamDetail {
  id: number
  name: string
  color: string
  level: number
  levelTitle: string
  points: number
  missionsCompleted: number
  missionsInReview: number
  leader: string
  members: { id: string; name: string }[]
}

export interface SchoolDetail {
  id: string
  name: string
  director: string
  color: string
  rankingPosition: number | null // null = aún sin puntos → sin puesto
  totalPoints: number
  missionsCompleted: number
  teams: SchoolTeamDetail[]
}

interface UsuarioMini {
  id: string
  nombre: string
  apellidos: string | null
  role_id: string | null
  team_id: number | null
}
interface TeamMini {
  id: number
  name: string
  level: number | null
  points: number | null
  missions_completed: number | null
  leader_id: string | null
}
interface SchoolDetailRow {
  id: string
  name: string
  color: string | null
  points: number | null
  missions_completed: number | null
  teams: TeamMini[] | null
  usuarios: UsuarioMini[] | null
}

function fullName(u: { nombre: string; apellidos: string | null }): string {
  return [u.nombre, u.apellidos].filter(Boolean).join(' ')
}

/**
 * Colegios (ordenados por puntos) con sus equipos, cada uno con líder y
 * miembros (alumnos). El color del equipo se hereda del colegio.
 */
export async function getSchoolsDetail(): Promise<SchoolDetail[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('schools')
    .select(
      'id, name, color, points, missions_completed, teams ( id, name, level, points, missions_completed, leader_id ), usuarios ( id, nombre, apellidos, role_id, team_id )',
    )
    .order('points', { ascending: false })

  if (error) throw new Error(`getSchoolsDetail: ${error.message}`)

  // Misiones en revisión por equipo (una consulta y se agrupa en memoria)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reviews, error: reviewError } = await (supabase as any)
    .from('mission_progression')
    .select('team_id')
    .eq('status', 'review')

  if (reviewError) throw new Error(`getSchoolsDetail(reviews): ${reviewError.message}`)

  const reviewCount = new Map<number, number>()
  for (const r of (reviews ?? []) as { team_id: number }[]) {
    reviewCount.set(r.team_id, (reviewCount.get(r.team_id) ?? 0) + 1)
  }

  let rank = 0
  return ((data ?? []) as SchoolDetailRow[]).map((row) => {
    const users = row.usuarios ?? []
    const director = users.find((u) => u.role_id === DIRECTOR_ROLE)

    const teams: SchoolTeamDetail[] = (row.teams ?? []).map((t) => {
      const level = t.level ?? 1
      const leaderUser = users.find((u) => u.id === t.leader_id)
      // Los miembros son los alumnos: usuarios del equipo excluyendo al líder
      const members = users
        .filter((u) => u.team_id === t.id && u.id !== t.leader_id)
        .map((u) => ({ id: u.id, name: fullName(u) }))
      return {
        id: t.id,
        name: t.name,
        color: row.color ?? '#7C3AED',
        level,
        levelTitle: LEVEL_TITLES[level] ?? 'Guardián',
        points: t.points ?? 0,
        missionsCompleted: t.missions_completed ?? 0,
        missionsInReview: reviewCount.get(t.id) ?? 0,
        leader: leaderUser ? fullName(leaderUser) : '—',
        members,
      }
    })

    const totalPoints = row.points ?? 0
    return {
      id: row.id,
      name: row.name,
      director: director ? fullName(director) : '—',
      color: row.color ?? '#7C3AED',
      rankingPosition: totalPoints > 0 ? ++rank : null,
      totalPoints,
      missionsCompleted: row.missions_completed ?? 0,
      teams,
    }
  })
}
