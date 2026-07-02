/** Colegio con su posición de ranking calculada (dominio de lectura). */
export interface SchoolRanking {
  id: string
  name: string
  short: string
  color: string
  points: number
  missionsCompleted: number
  totalTeams: number
  rankingPosition: number
}
