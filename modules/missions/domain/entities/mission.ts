import { z } from 'zod'

export const MISSION_TYPES = ['trivia', 'photo', 'creative'] as const

/** Misión (dominio). Forma que consume la UI: opciones ya como texto plano
 *  y coordenadas ya parseadas a [lng, lat]. */
export const MissionSchema = z.object({
  id: z.string(),
  chapterId: z.string(),
  location: z.string(),
  coordinates: z.tuple([z.number(), z.number()]),
  type: z.enum(MISSION_TYPES),
  points: z.number(),
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.number(),
})

export type Mission = z.infer<typeof MissionSchema>
export type MissionType = Mission['type']

/** Variante de pregunta de una misión de trivia. Una misión puede tener
 *  1..N variantes; al empezar la misión se asigna una al azar por equipo.
 *  Misma forma que consume la UI: opciones ya como texto plano y respuesta
 *  correcta ya como índice. */
export const MissionQuestionSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.number(),
})

export type MissionQuestion = z.infer<typeof MissionQuestionSchema>

/** Estados posibles de una misión para un equipo (tabla mission_progression + derivados). */
export type MissionStatus = 'available' | 'in_progress' | 'completed' | 'review' | 'locked' | 'rejected'
