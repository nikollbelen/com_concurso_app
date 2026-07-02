'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getReviewData,
  setMissionStatus,
} from '@/modules/missions/infrastructure/repositories/mission-progress.repository'

/** Datos del panel del docente (equipo + evidencias en revisión + aprobadas). */
export function useReviewData(teamId: number | undefined) {
  return useQuery({
    queryKey: ['review-data', teamId],
    queryFn: () => getReviewData(teamId as number),
    enabled: typeof teamId === 'number',
    staleTime: 1000 * 15,
  })
}

/**
 * Mutación para aprobar/rechazar una evidencia. Al terminar refresca los datos
 * del panel del equipo correspondiente.
 */
export function useSetMissionStatus(teamId: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'completed' | 'rejected' }) =>
      setMissionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-data', teamId] })
    },
  })
}
