'use client'

import { useQuery } from '@tanstack/react-query'
import {
  getMissions,
  getMissionById,
} from '@/modules/missions/infrastructure/repositories/missions.repository'

/** Todas las misiones del concurso. */
export function useMissions() {
  return useQuery({
    queryKey: ['missions'],
    queryFn: getMissions,
    staleTime: 1000 * 60 * 60, // 1 hora
  })
}

/** Una misión por id (detalle). */
export function useMission(id: string | undefined) {
  return useQuery({
    queryKey: ['mission', id],
    queryFn: () => getMissionById(id as string),
    enabled: typeof id === 'string' && id.length > 0,
    staleTime: 1000 * 60 * 60,
  })
}
