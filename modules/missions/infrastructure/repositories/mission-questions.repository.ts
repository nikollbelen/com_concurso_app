import { supabase } from '@/shared/infrastructure/supabase/client'
import {
  MissionQuestionSchema,
  type MissionQuestion,
} from '@/modules/missions/domain/entities/mission'

const LETTERS = ['A', 'B', 'C', 'D']

/** Fila cruda de la tabla `mission_questions`. */
interface QuestionRow {
  id: string
  mission_id: string
  question: string | null
  options: { label: string; text: string }[] | null
  correct_answer: string | null
}

/** Convierte la fila cruda a la forma que consume la UI (opciones como texto
 *  plano, respuesta correcta como índice). Misma lógica que missions.repository. */
function mapQuestion(row: QuestionRow): MissionQuestion {
  return MissionQuestionSchema.parse({
    id: row.id,
    missionId: row.mission_id,
    question: row.question ?? '',
    options: (row.options ?? []).map((o) => o.text),
    correctAnswer: Math.max(0, LETTERS.indexOf(row.correct_answer ?? 'A')),
  })
}

/** Todas las variantes de pregunta de una misión (para el editor / conteo). */
export async function getMissionQuestions(missionId: string): Promise<MissionQuestion[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('mission_questions')
    .select('id, mission_id, question, options, correct_answer')
    .eq('mission_id', missionId)
    .is('deleted_at', null)

  if (error) throw new Error(`getMissionQuestions: ${error.message}`)
  return ((data ?? []) as QuestionRow[]).map(mapQuestion)
}

/**
 * Variante que le fue asignada a un equipo en una misión concreta.
 *
 * Lee `mission_progression.question_id` (la variante que se fijó al empezar la
 * misión) y trae esa variante. Devuelve `null` si el equipo aún no empezó la
 * misión, o si la misión no es de trivia (no tiene variante asignada).
 */
export async function getAssignedQuestion(
  teamId: number,
  missionId: string,
): Promise<MissionQuestion | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('mission_progression')
    .select('mission_questions(id, mission_id, question, options, correct_answer)')
    .eq('team_id', teamId)
    .eq('mission_id', missionId)
    .not('question_id', 'is', null)
    .maybeSingle()

  if (error) throw new Error(`getAssignedQuestion: ${error.message}`)
  const q = (data?.mission_questions ?? null) as QuestionRow | null
  return q ? mapQuestion(q) : null
}
