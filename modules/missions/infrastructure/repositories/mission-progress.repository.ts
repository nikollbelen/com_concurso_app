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

/** El equipo ya tiene otra misión activa (in_progress); solo puede llevar una a la vez. */
export class TeamBusyError extends Error {
  constructor() {
    super('TEAM_BUSY')
    this.name = 'TeamBusyError'
  }
}

/** Postgres unique_violation → el índice parcial `una misión activa por equipo` se disparó. */
function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505'
}

/**
 * Marca una misión como `in_progress` para un equipo (el alumno pulsó
 * "Empezar misión" y va en camino al lugar físico del marcador).
 *
 * Regla: un equipo solo puede tener UNA misión activa a la vez. Si ya hay otra
 * misión en `in_progress`, lanza `TeamBusyError` (nadie del equipo puede empezar
 * otra hasta que la activa se envíe a revisión o se complete). El índice único
 * parcial en BD es el respaldo contra carreras entre dos alumnos del equipo.
 *
 * Si ya existe una fila de progreso para esta misión solo la mueve a
 * `in_progress` cuando sigue `available`; nunca pisa un estado ya avanzado
 * (review/completed).
 */
export async function startMission(teamId: number, missionId: string): Promise<void> {
  // Guardia: ¿el equipo ya tiene otra misión activa?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: active, error: activeErr } = await (supabase as any)
    .from('mission_progression')
    .select('mission_id')
    .eq('team_id', teamId)
    .eq('status', 'in_progress')
    .maybeSingle()

  if (activeErr) throw new Error(`startMission(active): ${activeErr.message}`)
  if (active && active.mission_id !== missionId) throw new TeamBusyError()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing, error: findErr } = await (supabase as any)
    .from('mission_progression')
    .select('id, status')
    .eq('team_id', teamId)
    .eq('mission_id', missionId)
    .maybeSingle()

  if (findErr) throw new Error(`startMission(find): ${findErr.message}`)

  if (existing) {
    if (existing.status !== 'available') return // ya avanzada → no tocar
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('mission_progression')
      .update({ status: 'in_progress' })
      .eq('id', existing.id)
    if (error) {
      if (isUniqueViolation(error)) throw new TeamBusyError()
      throw new Error(`startMission(update): ${error.message}`)
    }
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('mission_progression')
    .insert({ team_id: teamId, mission_id: missionId, status: 'in_progress' })
  if (error) {
    if (isUniqueViolation(error)) throw new TeamBusyError()
    throw new Error(`startMission(insert): ${error.message}`)
  }
}

/* ─────────────────────────────────────────────────────────────
 * Revisión de evidencias (panel del docente/líder)
 * ───────────────────────────────────────────────────────────── */

export interface ReviewMember {
  id: string
  name: string
  alias: string
}
export interface ReviewTeam {
  teamId: number
  teamName: string
  level: number | null
  points: number | null
  color: string | null
  schoolName: string
  members: ReviewMember[]
}
export interface PendingEvidence {
  id: string
  photo: string | null
  createdAt: string
  missionTitle: string
  missionPoints: number | null
  missionType: string | null
}
export interface ReviewData {
  team: ReviewTeam | null
  pending: PendingEvidence[]
  approvedCount: number
}

interface VistaRow {
  team_id: number
  team_name: string
  level: number | null
  points: number | null
  color: string | null
  school_name: string
  members: ReviewMember[] | null
}
interface PendingRow {
  id: string
  photo: string | null
  created_at: string
  missions: { location: string | null; points: number | null; type: string | null } | null
}

/** Datos del panel del docente: equipo (vista), evidencias en revisión y nº de aprobadas. */
export async function getReviewData(teamId: number): Promise<ReviewData> {
  const [teamRes, pendingRes, completedRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('vista_equipos_completos').select('*').eq('team_id', teamId).single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('mission_progression')
      // La misión no tiene columna `title`; su nombre visible es `location`
      .select('id, photo, created_at, missions!inner(location, points, type)')
      .eq('team_id', teamId)
      .eq('status', 'review'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('mission_progression')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .eq('status', 'completed'),
  ])

  if (teamRes.error) throw new Error(`getReviewData(team): ${teamRes.error.message}`)

  const t = teamRes.data as VistaRow | null
  const team: ReviewTeam | null = t
    ? {
        teamId: t.team_id,
        teamName: t.team_name,
        level: t.level,
        points: t.points,
        color: t.color,
        schoolName: t.school_name,
        members: t.members ?? [],
      }
    : null

  const pending: PendingEvidence[] = ((pendingRes.data ?? []) as PendingRow[]).map((item) => ({
    id: item.id,
    photo: item.photo,
    createdAt: item.created_at,
    missionTitle: item.missions?.location ?? 'Misión',
    missionPoints: item.missions?.points ?? null,
    missionType: item.missions?.type ?? null,
  }))

  return { team, pending, approvedCount: completedRes.count ?? 0 }
}

/** Aprueba o rechaza una evidencia (cambia el estado de la progresión). */
export async function setMissionStatus(
  progressionId: string,
  status: 'completed' | 'rejected',
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('mission_progression')
    .update({ status })
    .eq('id', progressionId)
  if (error) throw new Error(`setMissionStatus: ${error.message}`)
}
