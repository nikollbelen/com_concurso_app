'use client'

import { useQuery } from '@tanstack/react-query'
import { isDemoMode } from '@/shared/infrastructure/demo/config'
import { getDemoSchoolRanking, getDemoSchoolsDetail } from '@/shared/infrastructure/demo/demo-data'
import {
  getSchoolRanking,
  getSchoolsDetail,
} from '@/modules/schools/infrastructure/repositories/schools.repository'

/**
 * Ranking de colegios (usado por /ranking, home y stats del director).
 * `refetchInterval` opcional para vistas "en vivo" (p.ej. el tablero) — solo
 * afecta al observador que lo pide, no a las demás páginas.
 */
export function useSchoolRanking(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['school-ranking', isDemoMode ? 'demo' : 'live'],
    queryFn: getSchoolRanking,
    initialData: isDemoMode ? getDemoSchoolRanking : undefined,
    staleTime: 1000 * 30,
    refetchInterval: options?.refetchInterval,
  })
}

/** Colegios con equipos + miembros (paneles admin y director). */
export function useSchoolsDetail() {
  return useQuery({
    queryKey: ['schools-detail', isDemoMode ? 'demo' : 'live'],
    queryFn: getSchoolsDetail,
    initialData: isDemoMode ? getDemoSchoolsDetail : undefined,
    staleTime: 1000 * 30,
  })
}
