import { supabase } from '@/shared/infrastructure/supabase/client'
import { ChapterSchema, type Chapter } from '@/modules/chapters/domain/entities/chapter'

/** Fila cruda de la tabla `chapters` (con join a `fragments`). */
interface ChapterRow {
  id: string
  number: number
  title: string
  subtitle: string | null
  required_level: number | null
  color: string | null
  total_missions: number | null
  fragments: { id: string; name: string; icon: string } | null
}

/**
 * Trae los capítulos ordenados por número, con su fragmento asociado.
 * Mapea la fila de Supabase a la entidad de dominio y valida con Zod.
 */
export async function getChapters(): Promise<Chapter[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('chapters')
    .select('id, number, title, subtitle, required_level, color, total_missions, fragments ( id, name, icon )')
    .order('number', { ascending: true })

  if (error) throw new Error(`getChapters: ${error.message}`)

  return ((data ?? []) as ChapterRow[]).map((row) =>
    ChapterSchema.parse({
      id: row.id,
      number: row.number,
      title: row.title,
      subtitle: row.subtitle ?? '',
      fragment: {
        id: row.fragments?.id ?? '',
        name: row.fragments?.name ?? '',
        icon: row.fragments?.icon ?? '',
      },
      requiredLevel: row.required_level ?? 1,
      color: row.color ?? '#7C3AED',
      totalMissions: row.total_missions ?? 0,
    }),
  )
}
