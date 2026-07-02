'use client'

import { useQuery } from '@tanstack/react-query'
import { getTeam } from '@/modules/teams/infrastructure/repositories/teams.repository'

/** Equipo del usuario. Se desactiva si no hay teamId (director/admin). */
export function useTeam(teamId: number | undefined) {
  return useQuery({
    queryKey: ['team', teamId],
    queryFn: () => getTeam(teamId as number),
    enabled: typeof teamId === 'number',
    staleTime: 1000 * 30,
  })
}
