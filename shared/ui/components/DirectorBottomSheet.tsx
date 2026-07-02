'use client'

import { Users, Trophy, CheckCircle } from 'lucide-react'

interface DirectorBottomSheetProps {
  schoolName: string
  rankingPosition: number | null
  totalTeams: number
  missionsCompleted: number
  totalPoints: number
}

export function DirectorBottomSheet({
  schoolName,
  rankingPosition,
  totalTeams,
  missionsCompleted,
  totalPoints,
}: DirectorBottomSheetProps) {
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
            <p
              className="text-[9px] uppercase tracking-widest font-bold"
              style={{ fontFamily: 'var(--font-exo2), sans-serif', color: '#00f0ff' }}
            >
              Resumen de tu colegio
            </p>
            <p
              className="text-[9px] font-bold truncate max-w-[55%] text-right"
              style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.35)' }}
            >
              {schoolName}
            </p>
          </div>

          {/* Stats row */}
          <div className="flex items-stretch gap-2">

            {/* Ranking */}
            <div
              className="flex-1 flex flex-col items-center py-2.5 rounded-2xl"
              style={{ background: 'rgba(255,214,0,0.08)', border: '1px solid rgba(255,214,0,0.2)' }}
            >
              <Trophy className="w-4 h-4 mb-1" style={{ color: '#FFD600' }} />
              <span
                className="text-lg font-black leading-none"
                style={{ fontFamily: 'var(--font-exo2), sans-serif', color: '#FFD600' }}
              >
                {rankingPosition != null ? `#${rankingPosition}` : '—'}
              </span>
              <span
                className="text-[8px] uppercase tracking-wider mt-0.5"
                style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.35)' }}
              >
                Ranking
              </span>
            </div>

            {/* Teams */}
            <div
              className="flex-1 flex flex-col items-center py-2.5 rounded-2xl"
              style={{ background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.15)' }}
            >
              <Users className="w-4 h-4 mb-1" style={{ color: '#00f0ff' }} />
              <span
                className="text-lg font-black leading-none"
                style={{ fontFamily: 'var(--font-exo2), sans-serif', color: '#00f0ff' }}
              >
                {totalTeams}
              </span>
              <span
                className="text-[8px] uppercase tracking-wider mt-0.5"
                style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.35)' }}
              >
                Equipos
              </span>
            </div>

            {/* Missions */}
            <div
              className="flex-1 flex flex-col items-center py-2.5 rounded-2xl"
              style={{ background: 'rgba(0,230,118,0.07)', border: '1px solid rgba(0,230,118,0.2)' }}
            >
              <CheckCircle className="w-4 h-4 mb-1" style={{ color: '#00E676' }} />
              <span
                className="text-lg font-black leading-none"
                style={{ fontFamily: 'var(--font-exo2), sans-serif', color: '#00E676' }}
              >
                {missionsCompleted}
              </span>
              <span
                className="text-[8px] uppercase tracking-wider mt-0.5"
                style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.35)' }}
              >
                Misiones
              </span>
            </div>

            {/* Points */}
            <div
              className="flex-1 flex flex-col items-center py-2.5 rounded-2xl"
              style={{ background: 'rgba(249,189,34,0.07)', border: '1px solid rgba(249,189,34,0.2)' }}
            >
              <span className="text-sm mb-1" style={{ lineHeight: 1 }}>⚡</span>
              <span
                className="text-sm font-black leading-none tabular-nums"
                style={{ fontFamily: 'var(--font-exo2), sans-serif', color: '#f9bd22' }}
              >
                {totalPoints >= 1000
                  ? `${(totalPoints / 1000).toFixed(1)}k`
                  : totalPoints}
              </span>
              <span
                className="text-[8px] uppercase tracking-wider mt-0.5"
                style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.35)' }}
              >
                Puntos
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
