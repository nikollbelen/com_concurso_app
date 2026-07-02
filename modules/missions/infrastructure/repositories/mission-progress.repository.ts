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
