/** Equipo (dominio). El color NO vive aquí: se hereda del colegio (school). */
export interface Team {
  id: number
  name: string
  points: number
  level: number
  nextLevelPoints: number
  currentChapterId: string | null
  missionsCompleted: number
}
