'use client'

import { useQuery } from '@tanstack/react-query'
import { getTeamProgress } from '@/modules/missions/infrastructure/repositories/mission-progress.repository'

/**
 * Progreso de misiones del equipo indicado. Se desactiva si no hay teamId
 * (p.ej. director/admin, que no pertenecen a un equipo).
 */
export function useTeamProgress(teamId: number | undefined) {
  return useQuery({
    queryKey: ['team-progress', teamId],
    queryFn: () => getTeamProgress(teamId as number),
    enabled: typeof teamId === 'number',
    staleTime: 1000 * 30,
  })
}
