'use client'

import { useQuery } from '@tanstack/react-query'
import { getChapters } from '@/modules/chapters/infrastructure/repositories/chapters.repository'

/** Capítulos del concurso. Contenido casi estático → staleTime largo. */
export function useChapters() {
  return useQuery({
    queryKey: ['chapters'],
    queryFn: getChapters,
    staleTime: 1000 * 60 * 60, // 1 hora
  })
}
