'use client'

import { Trophy } from 'lucide-react'
import { useSchoolRanking } from '@/modules/schools/presentation/hooks/useSchoolRanking'

// Interfaces internas adaptadas para los datos reales de Supabase
export interface SchoolRank {
  position: number
  name: string
  points: number
  teams: number
}

const MEDALS = ['🥇', '🥈', '🥉']
const MEDAL_COLORS = ['#FFD600', '#9E9E9E', '#CD7F32']

export function AdminBottomSheet() {
  const { data: schools = [], isLoading: loading, isError } = useSchoolRanking()
  const totalSchools = schools.length
  const totalMissionsCompleted = schools.reduce((sum, school) => sum + school.missionsCompleted, 0)
  const top3: SchoolRank[] = schools
    .filter(school => school.rankingPosition !== null)
    .slice(0, 3)
    .map(school => ({
      position: school.rankingPosition!,
      name: school.name,
      points: school.points,
      teams: school.totalTeams,
    }))

  // Estado de carga discreto (mantiene el layout HUD fijo para evitar parpadeos molestos en la UI)
  if (loading) {
    return (
      <div
        className="fixed left-0 right-0 z-40 flex flex-col items-center px-5 pointer-events-none"
        style={{ bottom: 'max(20px, env(safe-area-inset-bottom))' }}
      >
        <div
          className="glass-panel hud-scanline w-full rounded-3xl p-4 flex items-center justify-center"
          style={{ maxWidth: 440, height: 215, boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.05)' }}
        >
          <span className="text-xs font-bold animate-pulse" style={{ color: '#00f0ff', fontFamily: 'var(--font-exo2), sans-serif' }}>
            CONECTANDO AL CENTRO DE MANDO...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed left-0 right-0 z-40 flex flex-col items-center px-5 pointer-events-none"
      style={{ bottom: 'max(20px, env(safe-area-inset-bottom))' }}
    >
      <div
        className="glass-panel hud-scanline w-full rounded-3xl pointer-events-auto"
        style={{
          maxWidth: 440,
          boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        <div className="px-4 py-3">

          {/* Header */}
          {isError && (
            <p className="mb-3 text-xs text-white/70" role="alert">No se pudieron cargar las metricas del evento.</p>
          )}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.25)' }}
              >
                <Trophy className="w-3 h-3" style={{ color: '#00f0ff' }} />
              </div>
              <h3
                className="text-[10px] uppercase tracking-widest font-black"
                style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.4)' }}
              >
                Estado Global de la Región
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-baseline gap-1">
                <span
                  className="text-[11px] font-black tabular-nums"
                  style={{ fontFamily: 'var(--font-exo2), sans-serif', color: '#00f0ff' }}
                >
                  {totalSchools}
                </span>
                <span
                  className="text-[8px] font-bold uppercase tracking-wider"
                  style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.3)' }}
                >
                  I.E.
                </span>
              </div>
              <div className="w-px h-3.5" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <div className="flex items-baseline gap-1">
                <span
                  className="text-[11px] font-black tabular-nums"
                  style={{ fontFamily: 'var(--font-exo2), sans-serif', color: '#00e676' }}
                >
                  {totalMissionsCompleted}
                </span>
                <span
                  className="text-[8px] font-bold uppercase tracking-wider"
                  style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.3)' }}
                >
                  Misiones
                </span>
              </div>
            </div>
          </div>

          {/* Top 3 Podio List */}
          <div className="flex flex-col gap-1.5">
            {top3.map((school, i) => (
              <div
                key={school.position}
                className="flex items-center gap-2.5 px-3 py-2 rounded-2xl"
                style={{
                  background: `${MEDAL_COLORS[i]}0d`,
                  border: `1px solid ${MEDAL_COLORS[i]}30`,
                }}
              >
                <span className="text-base shrink-0 leading-none">{MEDALS[i]}</span>
                <p
                  className="flex-1 text-[11px] font-bold leading-tight truncate text-white"
                  style={{ fontFamily: 'var(--font-cinzel), serif' }}
                >
                  {school.name}
                </p>
                <div className="flex items-baseline gap-1 shrink-0">
                  <span
                    className="text-[12px] font-black tabular-nums"
                    style={{ fontFamily: 'var(--font-exo2), sans-serif', color: MEDAL_COLORS[i] }}
                  >
                    {school.points.toLocaleString('es-PE')}
                  </span>
                  <span
                    className="text-[9px] font-bold"
                    style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.3)' }}
                  >
                    XP
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
