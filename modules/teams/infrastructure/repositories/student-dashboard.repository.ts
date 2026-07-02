import { supabase } from '@/shared/infrastructure/supabase/client'

const LEVEL_TITLES: Record<number, string> = {
  1: 'Iniciado',
  2: 'Explorador Histórico',
  3: 'Guardián Novato',
  4: 'Guardián Valiente',
  5: 'Guardián Maestro',
}

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

export interface StudentDashboard {
  level: number
  points: number
  levelTitle: string
  earnedFragments: string[]
  chapters: StudentChapter[]
  totalCompleted: number
  totalReview: number
  totalSchools: number
}

interface VistaRow {
  level: number | null
  points: number | null
  earned_fragments: string[] | null
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
  const [teamRes, chaptersRes, progressRes, schoolsCountRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('vista_equipos_completos').select('*').eq('team_id', teamId).maybeSingle(),
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
  const level = team?.level ?? 1
  const points = team?.points ?? 0
  const earnedFragments = team?.earned_fragments ?? []
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

  return {
    level,
    points,
    levelTitle: LEVEL_TITLES[level] ?? 'Guardián',
    earnedFragments,
    chapters,
    totalCompleted: progress.filter((p) => isCompleted(p.status)).length,
    totalReview: progress.filter((p) => isReview(p.status)).length,
    totalSchools: schoolsCountRes.count ?? 0,
  }
}
