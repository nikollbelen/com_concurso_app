'use client'

import { useQuery } from '@tanstack/react-query'
import { getSchoolRanking } from '@/modules/schools/infrastructure/repositories/schools.repository'

/** Ranking de colegios (usado por /ranking, panel admin y stats del director). */
export function useSchoolRanking() {
  return useQuery({
    queryKey: ['school-ranking'],
    queryFn: getSchoolRanking,
    staleTime: 1000 * 30,
  })
}
