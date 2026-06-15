'use client'

import { Trophy } from 'lucide-react'

export interface SchoolRank {
  position: number
  name: string
  points: number
  teams: number
}

interface AdminBottomSheetProps {
  top3: SchoolRank[]
  totalSchools: number
  totalMissionsCompleted: number
}

const MEDALS   = ['🥇', '🥈', '🥉']
const MEDAL_COLORS = ['#FFD600', '#9E9E9E', '#CD7F32']

export function AdminBottomSheet({ top3, totalSchools, totalMissionsCompleted }: AdminBottomSheetProps) {
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
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" style={{ color: '#FFD600' }} />
              <p
                className="text-[9px] uppercase tracking-widest font-bold"
                style={{ fontFamily: 'var(--font-exo2), sans-serif', color: '#00f0ff' }}
              >
                Ranking global
              </p>
            </div>
            <p
              className="text-[9px] font-bold"
              style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.35)' }}
            >
              {totalMissionsCompleted} misiones · {totalSchools} colegios
            </p>
          </div>

          {/* Top 3 */}
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
