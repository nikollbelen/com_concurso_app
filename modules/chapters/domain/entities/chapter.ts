import { z } from 'zod'

/** Capítulo del concurso (dominio). Forma consumida por la UI. */
export const ChapterSchema = z.object({
  id: z.string(),
  number: z.number(),
  title: z.string(),
  subtitle: z.string(),
  fragment: z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string(),
  }),
  requiredLevel: z.number(),
  color: z.string(),
  totalMissions: z.number(),
})

export type Chapter = z.infer<typeof ChapterSchema>
