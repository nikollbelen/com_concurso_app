'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getLeaderReviewData,
  setMissionStatus,
} from '@/modules/missions/infrastructure/repositories/mission-progress.repository'

/**
 * Datos del panel del docente multi-equipo: un bloque por cada equipo que
 * lidera (resuelto por `teams.leader_id`, no por `usuarios.team_id`).
 */
export function useLeaderReviewData(leaderId: string | undefined) {
  return useQuery({
    queryKey: ['leader-review-data', leaderId],
    queryFn: () => getLeaderReviewData(leaderId as string),
    enabled: typeof leaderId === 'string' && leaderId.length > 0,
    staleTime: 1000 * 15,
  })
}

/**
 * Mutación para aprobar/rechazar una evidencia desde el panel multi-equipo.
 * Refresca todos los equipos del docente tras cada acción.
 */
export function useLeaderSetMissionStatus(leaderId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'completed' | 'rejected' }) =>
      setMissionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leader-review-data', leaderId] })
    },
  })
}
