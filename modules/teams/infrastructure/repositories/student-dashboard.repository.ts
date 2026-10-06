import { supabase } from '@/shared/infrastructure/supabase/client'
import { isDemoMode } from '@/shared/infrastructure/demo/config'
import { getDemoStudentDashboard } from '@/shared/infrastructure/demo/demo-data'

export interface StudentChapter {
  id: string
  number: number
  title: string
  color: string
  fragmentId: string
  fragmentName: string
  fragmentIcon: string
  total: number
  completed: number
  review: number
  locked: boolean
}

export interface TeamMember {
  id: string
  name: string
  alias: string
  /** true si es el líder/docente guía del equipo (teams.leader_id). */
  isLeader: boolean
}

export interface StudentDashboard {
  teamName: string
  members: TeamMember[]
  level: number
  points: number
  levelTitle: string
  /** Puntos totales para subir al siguiente nivel (catálogo `levels`). null = nivel máximo. */
  nextLevelPoints: number | null
  earnedFragments: string[]
  chapters: StudentChapter[]
  totalCompleted: number
  totalReview: number
  /** Suma de misiones de todos los capítulos. */
  totalMissions: number
  /** Misiones que aún faltan por hacer (total − completadas − en revisión). */
  totalPending: number
  totalSchools: number
}

interface RawMember {
  id: string
  name: string | null
  alias: string | null
}
interface VistaRow {
  team_name: string | null
  level: number | null
  level_title: string | null
  next_level_points: number | null
  points: number | null
  earned_fragments: string[] | null
  members: RawMember[] | null
}
interface ChapterRow {
  id: string
  number: number
  title: string
  color: string | null
  total_missions: number | null
  required_level: number | null
  fragments: { id: string; name: string; icon: string } | null
}
interface ProgressRow {
  status: string
  missions: { id_chapter: string } | null
}

const isCompleted = (s: string) => s === 'completed' || s === 'aprobada'
const isReview = (s: string) => s === 'review' || s === 'pendiente'

/** Dashboard del alumno: nivel/puntos del equipo, fragmentos y progreso por capítulo. */
export async function getStudentDashboard(teamId: number): Promise<StudentDashboard> {
  if (isDemoMode) return getDemoStudentDashboard(teamId)

  const [teamRes, teamMetaRes, chaptersRes, progressRes, schoolsCountRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('vista_equipos_completos').select('*').eq('team_id', teamId).maybeSingle(),
    // leader_id no está en la vista; lo traemos directo de teams para marcar al líder.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('teams').select('leader_id').eq('id', teamId).maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('chapters')
      .select('id, number, title, color, total_missions, required_level, fragments:id_fragment(id, name, icon)')
      .order('number', { ascending: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('mission_progression')
      .select('status, missions:mission_id(id_chapter)')
      .eq('team_id', teamId),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('schools').select('id', { count: 'exact', head: true }),
  ])

  const team = teamRes.data as VistaRow | null
  const leaderId = (teamMetaRes.data as { leader_id: string | null } | null)?.leader_id ?? null
  const level = team?.level ?? 1
  const points = team?.points ?? 0
  const earnedFragments = team?.earned_fragments ?? []

  // Integrantes del equipo: líder primero, luego el resto por nombre.
  const members: TeamMember[] = (team?.members ?? [])
    .map((m) => ({
      id: m.id,
      name: m.name ?? m.alias ?? 'Sin nombre',
      alias: m.alias ?? '',
      isLeader: m.id === leaderId,
    }))
    .sort((a, b) =>
      a.isLeader === b.isLeader ? a.name.localeCompare(b.name, 'es') : a.isLeader ? -1 : 1,
    )
  const chapterRows = (chaptersRes.data ?? []) as ChapterRow[]
  const progress = (progressRes.data ?? []) as ProgressRow[]

  const chapters: StudentChapter[] = chapterRows.map((ch) => {
    const chProgress = progress.filter((p) => p.missions?.id_chapter === ch.id)
    return {
      id: ch.id,
      number: ch.number,
      title: ch.title,
      color: ch.color ?? '#7C3AED',
      fragmentId: ch.fragments?.id ?? '',
      fragmentName: ch.fragments?.name ?? '',
      fragmentIcon: ch.fragments?.icon ?? '',
      total: ch.total_missions ?? 0,
      completed: chProgress.filter((p) => isCompleted(p.status)).length,
      review: chProgress.filter((p) => isReview(p.status)).length,
      locked: level < (ch.required_level ?? 1),
    }
  })

  const totalCompleted = progress.filter((p) => isCompleted(p.status)).length
  const totalReview = progress.filter((p) => isReview(p.status)).length
  const totalMissions = chapters.reduce((sum, ch) => sum + ch.total, 0)

  return {
    teamName: team?.team_name ?? 'Mi Equipo',
    members,
    level,
    points,
    // Título del nivel: desde el catálogo `levels` (expuesto por la vista)
    levelTitle: team?.level_title ?? 'Guardián',
    // Umbral del siguiente nivel: catálogo `levels` vía vista. null = nivel máximo.
    nextLevelPoints: team?.next_level_points ?? null,
    earnedFragments,
    chapters,
    totalCompleted,
    totalReview,
    totalMissions,
    // Misiones por hacer: nunca negativo.
    totalPending: Math.max(0, totalMissions - totalCompleted - totalReview),
    totalSchools: schoolsCountRes.count ?? 0,
  }
}
