'use client'

import { Tooltip } from '@/shared/ui/components/Tooltip'

/* ── types ─────────────────────────────────────────────────── */

interface Team {
  name: string
  color: string
  level: number
  levelTitle: string
  points: number
  nextLevelPoints: number
}

type StudentProps = { role: 'student'; team: Team }
type StaffProps   = { role: 'leader' | 'director' | 'admin'; name: string; schoolName?: string; color: string }
export type GameHeaderProps = StudentProps | StaffProps

/* ── role config ─────────────────────────────────────────── */

const ROLE_LABEL: Record<'leader' | 'director' | 'admin', string> = {
  leader:   'Docente Líder',
  director: 'Director/a',
  admin:    'Administrador',
}

const ROLE_SHORT: Record<'leader' | 'director' | 'admin', string> = {
  leader:   'DOC',
  director: 'DIR',
  admin:    'ADM',
}

/* ── StudentHeader ───────────────────────────────────────── */

function StudentHeader({ team }: { team: Team }) {
  const xpPercent = Math.min(100, Math.round((team.points / team.nextLevelPoints) * 100))

  return (
    <div className="fixed top-5 left-5 right-5 z-50 flex items-start justify-between gap-3 pointer-events-none">

      {/* Left: team card */}
      <div
        className="glass-panel hud-scanline flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl pointer-events-auto"
        style={{
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)',
          maxWidth: 'calc(100vw - 130px)',
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 text-white"
          style={{
            background: `linear-gradient(135deg, ${team.color}dd, ${team.color})`,
            boxShadow: `0 3px 10px ${team.color}55`,
            fontFamily: 'var(--font-exo2), sans-serif',
          }}
        >
          {team.name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="text-[12px] font-bold leading-tight truncate text-white"
            style={{ fontFamily: 'var(--font-cinzel), serif', letterSpacing: '0.02em' }}
          >
            {team.name}
          </p>
          <p
            className="text-[9px] font-bold uppercase tracking-[0.12em] leading-none mt-0.5 truncate"
            style={{ fontFamily: 'var(--font-exo2), sans-serif', color: '#00f0ff' }}
          >
            {team.levelTitle ?? `Nivel ${team.level}`}
          </p>

          <div className="relative group flex items-center gap-2 mt-1">
            <div
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <div
                className="h-full rounded-full relative overflow-hidden"
                style={{
                  width: `${xpPercent}%`,
                  background: 'linear-gradient(90deg, #00a8ff, #00f0ff)',
                  boxShadow: '0 0 6px rgba(0,240,255,0.7)',
                  transition: 'width 0.7s ease',
                }}
              >
                <div
                  className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent"
                  style={{ animation: 'shimmer 2.5s infinite' }}
                />
              </div>
            </div>
            <span
              className="text-[10px] tabular-nums shrink-0"
              style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.4)' }}
            >
              {xpPercent}%
            </span>
            <Tooltip
              text={`${team.points} / ${team.nextLevelPoints} XP para el nivel ${team.level + 1}`}
              align="left"
              dir="down"
            />
          </div>
        </div>
      </div>

      {/* Right: XP + level badges */}
      <div className="flex items-center gap-2 shrink-0 pointer-events-auto">

        <div className="relative group">
          <div
            className="glass-panel hud-scanline flex items-center gap-1.5 px-3 py-2.5 rounded-2xl"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.35), inset 0 0 12px rgba(249,189,34,0.1)' }}
          >
            <span
              className="text-[10px] font-black uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(249,189,34,0.7)' }}
            >
              XP
            </span>
            <span
              className="text-sm font-black tabular-nums"
              style={{ fontFamily: 'var(--font-exo2), sans-serif', color: '#f9bd22' }}
            >
              {team.points.toLocaleString('es-PE')}
            </span>
          </div>
          <Tooltip text="Puntos de experiencia acumulados" align="right" dir="down" />
        </div>

        <div className="relative group">
          <div
            className="flex flex-col items-center px-2.5 py-2 rounded-2xl shrink-0"
            style={{
              background: 'linear-gradient(160deg, #00b4d8, #0077b6)',
              boxShadow: '0 4px 0 rgba(0,0,0,0.4), 0 0 16px rgba(0,240,255,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
              border: '1.5px solid rgba(0,240,255,0.4)',
            }}
          >
            <span
              className="text-[8px] leading-none tracking-widest uppercase text-white/70"
              style={{ fontFamily: 'var(--font-exo2), sans-serif' }}
            >
              NV
            </span>
            <span
              className="text-lg font-black leading-none text-white"
              style={{ fontFamily: 'var(--font-exo2), sans-serif' }}
            >
              {team.level}
            </span>
          </div>
          <Tooltip text={`${team.levelTitle ?? `Nivel ${team.level}`} · sube completando misiones`} align="right" dir="down" />
        </div>
      </div>
    </div>
  )
}

/* ── StaffHeader ─────────────────────────────────────────── */

function StaffHeader({ role, name, schoolName, color }: StaffProps) {
  return (
    <div className="fixed top-5 left-5 right-5 z-50 flex items-start justify-between gap-3 pointer-events-none">

      {/* Left: welcome card */}
      <div
        className="glass-panel hud-scanline flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl pointer-events-auto"
        style={{
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)',
          maxWidth: 'calc(100vw - 90px)',
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 text-white"
          style={{
            background: `linear-gradient(135deg, ${color}dd, ${color})`,
            boxShadow: `0 3px 10px ${color}55`,
            fontFamily: 'var(--font-exo2), sans-serif',
          }}
        >
          {name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="text-[9px] font-bold uppercase tracking-[0.12em] leading-none"
            style={{ fontFamily: 'var(--font-exo2), sans-serif', color: '#00f0ff' }}
          >
            {ROLE_LABEL[role]}
          </p>
          <p
            className="text-[12px] font-bold leading-tight truncate text-white mt-0.5"
            style={{ fontFamily: 'var(--font-cinzel), serif', letterSpacing: '0.02em' }}
          >
            {name}
          </p>
          {schoolName && (
            <p
              className="text-[9px] leading-none mt-0.5 truncate"
              style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.4)' }}
            >
              {schoolName}
            </p>
          )}
        </div>
      </div>

      {/* Right: role badge */}
      <div className="flex items-center shrink-0 pointer-events-auto">
        <div className="relative group">
          <div
            className="flex flex-col items-center px-2.5 py-2 rounded-2xl"
            style={{
              background: `linear-gradient(160deg, ${color}cc, ${color}ee)`,
              boxShadow: `0 4px 0 rgba(0,0,0,0.4), 0 0 16px ${color}44, inset 0 1px 0 rgba(255,255,255,0.25)`,
              border: `1.5px solid ${color}88`,
            }}
          >
            <span
              className="text-[8px] leading-none tracking-widest uppercase text-white/70"
              style={{ fontFamily: 'var(--font-exo2), sans-serif' }}
            >
              ROL
            </span>
            <span
              className="text-sm font-black leading-none text-white mt-1"
              style={{ fontFamily: 'var(--font-exo2), sans-serif' }}
            >
              {ROLE_SHORT[role]}
            </span>
          </div>
          <Tooltip text={ROLE_LABEL[role]} align="right" dir="down" />
        </div>
      </div>
    </div>
  )
}

/* ── GameHeader ──────────────────────────────────────────── */

export function GameHeader(props: GameHeaderProps) {
  if (props.role === 'student') return <StudentHeader team={props.team} />
  return <StaffHeader role={props.role} name={props.name} schoolName={props.schoolName} color={props.color} />
}
