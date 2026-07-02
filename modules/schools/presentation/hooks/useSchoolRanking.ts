'use client'

import { useQuery } from '@tanstack/react-query'
import {
  getSchoolRanking,
  getSchoolsDetail,
} from '@/modules/schools/infrastructure/repositories/schools.repository'

/** Ranking de colegios (usado por /ranking y stats del director en el mapa). */
export function useSchoolRanking() {
  return useQuery({
    queryKey: ['school-ranking'],
    queryFn: getSchoolRanking,
    staleTime: 1000 * 30,
  })
}

/** Colegios con equipos + miembros (paneles admin y director). */
export function useSchoolsDetail() {
  return useQuery({
    queryKey: ['schools-detail'],
    queryFn: getSchoolsDetail,
    staleTime: 1000 * 30,
  })
}
