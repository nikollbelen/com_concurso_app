import { supabase } from '@/shared/infrastructure/supabase/client'
import { MissionSchema, type Mission } from '@/modules/missions/domain/entities/mission'
import { isDemoMode } from '@/shared/infrastructure/demo/config'
import { getDemoMissionById, getDemoMissions } from '@/shared/infrastructure/demo/demo-data'

const LETTERS = ['A', 'B', 'C', 'D']

/** Fila cruda de la tabla `missions`. */
interface MissionRow {
  id: string
  id_chapter: string
  location: string | null
  coordinates: string | null
  type: string | null
  points: number | null
  question: string | null
  options: { label: string; text: string }[] | null
  correct_answer: string | null
}

/** Las coordenadas se guardan como texto `[lng, lat]` → se parsean a tupla. */
function parseCoordinates(raw: string | null): [number, number] {
  if (raw) {
    try {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr) && arr.length >= 2) {
        return [Number(arr[0]), Number(arr[1])]
      }
    } catch {
      /* formato inválido → cae al default */
    }
  }
  return [0, 0]
}

function mapRow(row: MissionRow): Mission {
  return MissionSchema.parse({
    id: row.id,
    chapterId: row.id_chapter,
    location: row.location ?? '',
    coordinates: parseCoordinates(row.coordinates),
    type: row.type ?? 'trivia',
    points: row.points ?? 0,
    question: row.question ?? '',
    options: (row.options ?? []).map((o) => o.text),
    correctAnswer: Math.max(0, LETTERS.indexOf(row.correct_answer ?? 'A')),
  })
}

/** Todas las misiones del concurso. */
export async function getMissions(): Promise<Mission[]> {
  if (isDemoMode) return getDemoMissions()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('missions')
    .select('id, id_chapter, location, coordinates, type, points, question, options, correct_answer')

  if (error) throw new Error(`getMissions: ${error.message}`)
  return ((data ?? []) as MissionRow[]).map(mapRow)
}

/** Una misión por id (para la vista de detalle /mision/[id]). */
export async function getMissionById(id: string): Promise<Mission | null> {
  if (isDemoMode) return getDemoMissionById(id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('missions')
    .select('id, id_chapter, location, coordinates, type, points, question, options, correct_answer')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return mapRow(data as MissionRow)
}
