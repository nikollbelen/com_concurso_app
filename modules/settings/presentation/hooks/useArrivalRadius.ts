'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getArrivalRadius,
  setArrivalRadius,
} from '@/modules/settings/infrastructure/repositories/settings.repository'

const KEY = ['settings', 'arrival-radius']

/** Radio de llegada (metros) configurado por el admin. */
export function useArrivalRadius() {
  return useQuery({
    queryKey: KEY,
    queryFn: getArrivalRadius,
    staleTime: 1000 * 60 * 5,
  })
}

/** Guarda el radio de llegada y refresca la caché. */
export function useSetArrivalRadius() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (meters: number) => setArrivalRadius(meters),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
