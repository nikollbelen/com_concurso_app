'use client'

import { useQuery } from '@tanstack/react-query'
import { getStudentDashboard } from '@/modules/teams/infrastructure/repositories/student-dashboard.repository'

/** Dashboard del alumno (panel). Se desactiva si el usuario no tiene equipo. */
export function useStudentDashboard(teamId: number | undefined) {
  return useQuery({
    queryKey: ['student-dashboard', teamId],
    queryFn: () => getStudentDashboard(teamId as number),
    enabled: typeof teamId === 'number',
    staleTime: 1000 * 15,
  })
}
