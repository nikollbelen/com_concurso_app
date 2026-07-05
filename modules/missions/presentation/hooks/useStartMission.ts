'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { startMission } from '@/modules/missions/infrastructure/repositories/mission-progress.repository'

/**
 * Marca una misión como `in_progress` (misión empezada, en camino al lugar).
 * Al terminar refresca el progreso del equipo para que la cartilla y el
 * marcador reflejen el nuevo estado.
 */
export function useStartMission(teamId: number | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (missionId: string) => startMission(teamId as number, missionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-progress', teamId] })
    },
    // Si falla (p. ej. otro alumno del equipo empezó otra misión primero →
    // TeamBusyError), re-sincroniza el progreso para que la cartilla y los
    // marcadores reflejen el estado real del equipo.
    onError: () => {
      qc.invalidateQueries({ queryKey: ['team-progress', teamId] })
    },
  })
}
