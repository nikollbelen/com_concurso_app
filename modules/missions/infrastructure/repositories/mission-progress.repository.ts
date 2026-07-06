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
 * Elige al azar una variante de pregunta para la misión.
 *
 * Solo las misiones de trivia tienen variantes en `mission_questions`; para
 * photo/creative no hay filas y devuelve `null` (no se asigna nada). Al ser la
 * ausencia de variantes lo que decide, no hace falta consultar el tipo aparte.
 *
 * Futuro: para "no repetir variante dentro del mismo colegio" bastaría excluir
 * aquí las variantes ya asignadas a otros equipos de la misma escuela.
 */
async function pickRandomVariantId(missionId: string): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('mission_questions')
    .select('id')
    .eq('mission_id', missionId)
    .is('deleted_at', null)

  if (error) throw new Error(`pickRandomVariantId: ${error.message}`)
  const ids = ((data ?? []) as { id: string }[]).map((r) => r.id)
  if (ids.length === 0) return null
  return ids[Math.floor(Math.random() * ids.length)]
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
 *
 * Además, en misiones de trivia asigna al equipo una VARIANTE de pregunta al
 * azar (`question_id`) la primera vez que empieza. La asignación es estable:
 * si ya tiene una variante fijada no se reasigna, así el equipo ve siempre la
 * misma pregunta aunque reabra la misión.
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
    .select('id, status, question_id')
    .eq('team_id', teamId)
    .eq('mission_id', missionId)
    .maybeSingle()

  if (findErr) throw new Error(`startMission(find): ${findErr.message}`)

  if (existing) {
    if (existing.status !== 'available') return // ya avanzada → no tocar
    // Asigna variante solo si aún no tiene una (asignación estable).
    const questionId = existing.question_id ?? (await pickRandomVariantId(missionId))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('mission_progression')
      .update({ status: 'in_progress', question_id: questionId })
      .eq('id', existing.id)
    if (error) {
      if (isUniqueViolation(error)) throw new TeamBusyError()
      throw new Error(`startMission(update): ${error.message}`)
    }
    return
  }

  const questionId = await pickRandomVariantId(missionId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('mission_progression')
    .insert({ team_id: teamId, mission_id: missionId, status: 'in_progress', question_id: questionId })
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

/* ─────────────────────────────────────────────────────────────
 * Panel del docente multi-equipo
 *
 * Un docente puede liderar UNO O MÁS equipos. Los equipos NO se resuelven por
 * usuarios.team_id (esa es la relación de miembro/alumno), sino por
 * teams.leader_id igual al id del docente (relación de líder).
 * ───────────────────────────────────────────────────────────── */

/** Bloque de revisión de UN equipo liderado por el docente. */
export interface LeaderTeamReview {
  team: ReviewTeam
  pending: PendingEvidence[]
  approvedCount: number
}

/**
 * Datos del panel del docente: un bloque por cada equipo que lidera
 * (info del equipo + evidencias en revisión + nº de aprobadas), ordenados por
 * nombre de equipo. Devuelve `[]` si el docente aún no lidera ningún equipo.
 */
export async function getLeaderReviewData(leaderId: string): Promise<LeaderTeamReview[]> {
  // 1. Equipos liderados por este docente (relación de líder, no de miembro)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: teamRows, error: teamErr } = await (supabase as any)
    .from('teams')
    .select('id')
    .eq('leader_id', leaderId)
    .is('deleted_at', null)

  if (teamErr) throw new Error(`getLeaderReviewData(teams): ${teamErr.message}`)

  const teamIds = ((teamRows ?? []) as { id: number }[]).map((r) => r.id)
  if (teamIds.length === 0) return []

  // 2. En paralelo: info de cada equipo (vista), evidencias en revisión y aprobadas
  const [viewRes, pendingRes, approvedRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('vista_equipos_completos').select('*').in('team_id', teamIds),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('mission_progression')
      // La misión no tiene columna `title`; su nombre visible es `location`
      .select('id, team_id, photo, created_at, missions!inner(location, points, type)')
      .in('team_id', teamIds)
      .eq('status', 'review'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('mission_progression')
      .select('team_id')
      .in('team_id', teamIds)
      .eq('status', 'completed'),
  ])

  if (viewRes.error) throw new Error(`getLeaderReviewData(view): ${viewRes.error.message}`)
  if (pendingRes.error) throw new Error(`getLeaderReviewData(pending): ${pendingRes.error.message}`)
  if (approvedRes.error) throw new Error(`getLeaderReviewData(approved): ${approvedRes.error.message}`)

  // Evidencias en revisión agrupadas por equipo
  const pendingByTeam = new Map<number, PendingEvidence[]>()
  for (const item of (pendingRes.data ?? []) as (PendingRow & { team_id: number })[]) {
    const list = pendingByTeam.get(item.team_id) ?? []
    list.push({
      id: item.id,
      photo: item.photo,
      createdAt: item.created_at,
      missionTitle: item.missions?.location ?? 'Misión',
      missionPoints: item.missions?.points ?? null,
      missionType: item.missions?.type ?? null,
    })
    pendingByTeam.set(item.team_id, list)
  }

  // Nº de misiones aprobadas por equipo
  const approvedByTeam = new Map<number, number>()
  for (const row of (approvedRes.data ?? []) as { team_id: number }[]) {
    approvedByTeam.set(row.team_id, (approvedByTeam.get(row.team_id) ?? 0) + 1)
  }

  const blocks: LeaderTeamReview[] = ((viewRes.data ?? []) as VistaRow[]).map((t) => ({
    team: {
      teamId: t.team_id,
      teamName: t.team_name,
      level: t.level,
      points: t.points,
      color: t.color,
      schoolName: t.school_name,
      members: t.members ?? [],
    },
    pending: pendingByTeam.get(t.team_id) ?? [],
    approvedCount: approvedByTeam.get(t.team_id) ?? 0,
  }))

  // Orden estable por nombre de equipo
  blocks.sort((a, b) => a.team.teamName.localeCompare(b.team.teamName))
  return blocks
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
