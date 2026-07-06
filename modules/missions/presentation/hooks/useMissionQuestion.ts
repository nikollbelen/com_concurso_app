'use client'

import { useQuery } from '@tanstack/react-query'
import { getAssignedQuestion } from '@/modules/missions/infrastructure/repositories/mission-questions.repository'

/**
 * Variante de pregunta que le fue asignada al equipo en una misión de trivia
 * (la que se fijó al empezar la misión). Devuelve `null` si la misión no es de
 * trivia o si el equipo aún no la empezó.
 */
export function useAssignedQuestion(teamId: number | undefined, missionId: string | undefined) {
  return useQuery({
    queryKey: ['assigned-question', teamId, missionId],
    queryFn: () => getAssignedQuestion(teamId as number, missionId as string),
    enabled: typeof teamId === 'number' && typeof missionId === 'string' && missionId.length > 0,
    staleTime: 1000 * 60 * 5,
  })
}
