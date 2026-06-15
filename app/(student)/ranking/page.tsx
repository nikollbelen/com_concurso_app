'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Trophy, Target, Users } from 'lucide-react'
import { useAuthStore } from '@/modules/auth/infrastructure/stores/authStore'
import { LogoutModal } from '@/shared/ui/components/LogoutModal'

const SCHOOLS = [
  { pos: 1,  name: 'I.E. Independencia Americana', short: 'Independencia', points: 1820, missions: 18, teams: 2 },
  { pos: 2,  name: 'I.E. La Salle',                short: 'La Salle',      points: 1640, missions: 16, teams: 2 },
  { pos: 3,  name: 'I.E. San Francisco',           short: 'San Francisco',  points: 1250, missions: 12, teams: 2 },
  { pos: 4,  name: 'I.E. Santa Rosa',              short: 'Santa Rosa',    points: 1100, missions: 11, teams: 2 },
  { pos: 5,  name: 'I.E. Gran Unidad Escolar',     short: 'Gran Unidad',   points: 980,  missions: 10, teams: 2 },
  { pos: 6,  name: 'I.E. Padre Damián de Veuster', short: 'Padre Damián',  points: 870,  missions: 9,  teams: 1 },
  { pos: 7,  name: 'I.E. Glorioso Guzmán',         short: 'Guzmán',        points: 760,  missions: 8,  teams: 2 },
  { pos: 8,  name: 'I.E. Miguel Grau',             short: 'Miguel Grau',   points: 640,  missions: 7,  teams: 1 },
  { pos: 9,  name: 'I.E. Honorio Delgado',         short: 'H. Delgado',    points: 540,  missions: 6,  teams: 1 },
  { pos: 10, name: 'I.E. Aplicación',              short: 'Aplicación',    points: 420,  missions: 5,  teams: 1 },
  { pos: 11, name: 'I.E. Manuel Muñoz Najar',      short: 'M. Najar',      points: 310,  missions: 4,  teams: 1 },
  { pos: 12, name: 'I.E. Andrés Avelino Cáceres',  short: 'A. Cáceres',    points: 230,  missions: 3,  teams: 1 },
  { pos: 13, name: 'I.E. Jorge Basadre',           short: 'J. Basadre',    points: 160,  missions: 2,  teams: 1 },
  { pos: 14, name: 'I.E. Próceres de la Independencia', short: 'Próceres', points: 90,   missions: 1,  teams: 1 },
  { pos: 15, name: 'I.E. Francisco Bolognesi',     short: 'Bolognesi',     points: 40,   missions: 1,  teams: 1 },
  { pos: 16, name: 'I.E. Túpac Amaru II',          short: 'Túpac Amaru',   points: 0,    missions: 0,  teams: 1 },
]

const MY_SCHOOL = 'San Francisco'

const MEDAL = {
  1: { emoji: '🥇', color: '#f9bd22', shadow: '0 0 24px rgba(249,189,34,0.4)', bg: 'rgba(249,189,34,0.1)', border: '1.5px solid rgba(249,189,34,0.5)' },
  2: { emoji: '🥈', color: '#CBD5E1', shadow: 'none',                          bg: 'rgba(203,213,225,0.06)', border: '1px solid rgba(203,213,225,0.2)' },
  3: { emoji: '🥉', color: '#c87533', shadow: 'none',                          bg: 'rgba(200,117,51,0.08)', border: '1px solid rgba(200,117,51,0.3)' },
} as const

function Tooltip({ text, align = 'center' }: { text: string; align?: 'left' | 'center' | 'right' }) {
  const h = align === 'left' ? 'left-0' : align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'
  return (
    <div className={`absolute bottom-full mb-2 ${h} whitespace-nowrap px-2.5 py-1.5 rounded-xl text-[11px] font-semibold pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50`}
      style={{ background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-exo2), sans-serif', backdropFilter: 'blur(8px)' }}>
      {text}
    </div>
  )
}

export default function RankingPage() {
  const router = useRouter()
  const { user, isHydrated, hydrate, logout } = useAuthStore()
  const [confirmLogout, setConfirmLogout] = useState(false)

  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => {
    if (isHydrated && !user) router.replace('/login')
  }, [user, isHydrated, router])

  if (!user) return null

  const myPos  = SCHOOLS.find(s => s.short === MY_SCHOOL)?.pos ?? 0
  const topXp  = SCHOOLS[0].points
  const totalMissions = SCHOOLS.reduce((a, s) => a + s.missions, 0)

  return (
    <div className="min-h-screen" style={{ background: '#0d1117', fontFamily: 'var(--font-exo2), sans-serif' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 glass-panel hud-scanline px-5 py-4 flex items-center gap-3"
        style={{ borderBottom: '1px solid rgba(0,240,255,0.15)' }}>
        <button onClick={() => router.push('/mapa')}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#f9bd22' }}>Clasificación general</p>
          <p className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-cinzel), serif' }}>Ranking de Colegios</p>
        </div>

        {/* Stats globales — visibles en desktop */}
        <div className="hidden md:flex items-center gap-5 mr-4">
          <div className="text-center">
            <p className="text-lg font-black tabular-nums" style={{ color: '#00f0ff' }}>{totalMissions}</p>
            <p className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>misiones completadas</p>
          </div>
          <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div className="text-center">
            <p className="text-lg font-black tabular-nums" style={{ color: '#f9bd22' }}>{SCHOOLS.length}</p>
            <p className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>colegios</p>
          </div>
        </div>

        <div className="relative group">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)' }}>
            <span className="text-xs font-bold" style={{ color: '#00f0ff' }}>Tu pos.</span>
            <span className="text-sm font-black" style={{ color: '#f9bd22' }}>#{myPos}</span>
          </div>
          <Tooltip text={`Tu colegio está en la posición #${myPos} de ${SCHOOLS.length} colegios`} align="right" />
        </div>
      </div>

      {/* ── Content: mobile stack / desktop side-by-side ──── */}
      <div className="mx-auto px-4 pt-6 pb-10 max-w-7xl lg:flex lg:gap-8 lg:items-start lg:px-8">

        {/* ── Columna izquierda: Podio ── */}
        <div className="lg:w-80 xl:w-96 shrink-0 lg:sticky lg:top-24">

          {/* Podio top 3 */}
          <p className="text-xs uppercase tracking-[0.2em] font-bold mb-4 text-center" style={{ color: '#f9bd22' }}>
            ── Top 3 ──
          </p>
          <div className="flex items-end justify-center gap-3 mb-6">
            {([SCHOOLS[1], SCHOOLS[0], SCHOOLS[2]] as typeof SCHOOLS).map((s, i) => {
              const posMap = [2, 1, 3] as const
              const rpos   = posMap[i]
              const m      = MEDAL[rpos]
              const heights = ['h-28', 'h-36', 'h-24']
              return (
                <div key={s.pos} className={`flex flex-col items-center flex-1 ${heights[i]}`}>
                  <div className={`w-full flex-1 rounded-2xl flex flex-col items-center justify-center gap-1 px-2 py-3`}
                    style={{ background: m.bg, border: m.border, boxShadow: m.shadow }}>
                    <span className="text-2xl">{m.emoji}</span>
                    <p className="text-xs font-black text-white text-center leading-tight">{s.short}</p>
                    <p className="text-base font-black tabular-nums" style={{ color: m.color }}>
                      {s.points.toLocaleString('es-PE')}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: `${m.color}99` }}>XP</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Stats resumen */}
          <div className="glass-panel hud-scanline rounded-2xl p-4 mb-4"
            style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: '#00f0ff' }}>Resumen del evento</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Colegios', value: SCHOOLS.length, color: '#00f0ff' },
                { label: 'Misiones completadas', value: totalMissions, color: '#00e676' },
                { label: 'XP líder', value: `${topXp.toLocaleString('es-PE')}`, color: '#f9bd22' },
                { label: 'Tu posición', value: `#${myPos}`, color: '#00f0ff' },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl p-2.5 text-center"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-lg font-black" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Columna derecha: lista completa ── */}
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-widest font-bold mb-3 mt-6 lg:mt-0" style={{ color: '#00f0ff' }}>
            Todos los colegios
          </p>

          {/* Cabecera */}
          <div className="hidden md:grid gap-3 px-4 mb-1"
            style={{ gridTemplateColumns: '2.5rem 1fr 7rem 4.5rem 4rem' }}>
            <span />
            <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>Colegio</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-right" style={{ color: 'rgba(255,255,255,0.3)' }}>XP Total</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>Misiones</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>Equipos</span>
          </div>

          <div className="flex flex-col gap-2">
            {SCHOOLS.map(s => {
              const isMe  = s.short === MY_SCHOOL
              const pct   = topXp > 0 ? (s.points / topXp) * 100 : 0
              const medal = s.pos <= 3 ? MEDAL[s.pos as 1|2|3] : null
              return (
                <div key={s.pos} className="glass-panel hud-scanline rounded-2xl px-4 py-3"
                  style={{
                    border: isMe ? '1px solid rgba(0,240,255,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    boxShadow: isMe ? '0 0 16px rgba(0,240,255,0.1)' : 'none',
                  }}>

                  {/* Mobile layout */}
                  <div className="md:hidden flex items-center gap-3">
                    <span className="text-base font-black w-7 text-center shrink-0"
                      style={{ color: medal ? medal.color : 'rgba(255,255,255,0.25)' }}>
                      {medal ? medal.emoji : s.pos}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-bold text-white truncate">{s.name}</p>
                        {isMe && <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(0,240,255,0.15)', color: '#00f0ff', border: '1px solid rgba(0,240,255,0.3)' }}>Tu colegio</span>}
                      </div>
                      <div className="w-full h-1 rounded-full mt-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: isMe ? 'linear-gradient(90deg,#00a8ff,#00f0ff)' : 'rgba(255,255,255,0.2)', transition: 'width 0.7s ease' }} />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-black tabular-nums" style={{ color: '#f9bd22' }}>{s.points.toLocaleString('es-PE')}</p>
                      <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>XP</p>
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:grid items-center gap-3"
                    style={{ gridTemplateColumns: '2.5rem 1fr 7rem 4.5rem 4rem' }}>
                    <span className="text-base font-black text-center"
                      style={{ color: medal ? medal.color : 'rgba(255,255,255,0.25)' }}>
                      {medal ? medal.emoji : s.pos}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white truncate">{s.name}</p>
                        {isMe && <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(0,240,255,0.15)', color: '#00f0ff', border: '1px solid rgba(0,240,255,0.3)' }}>Tu colegio</span>}
                      </div>
                      <div className="w-full h-1 rounded-full mt-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: isMe ? 'linear-gradient(90deg,#00a8ff,#00f0ff)' : 'rgba(255,255,255,0.2)', transition: 'width 0.7s ease' }} />
                      </div>
                    </div>
                    <div className="relative group text-right">
                      <p className="text-sm font-black tabular-nums" style={{ color: '#f9bd22' }}>{s.points.toLocaleString('es-PE')}</p>
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>XP total</p>
                      <Tooltip text="Suma de XP de todos los equipos del colegio" align="right" />
                    </div>
                    <div className="relative group flex items-center justify-center gap-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      <Target className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-sm font-bold">{s.missions}</span>
                      <Tooltip text="Misiones completadas en total" align="center" />
                    </div>
                    <div className="relative group flex items-center justify-center gap-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-sm font-bold">{s.teams}</span>
                      <Tooltip text="Equipos participantes de este colegio" align="right" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <LogoutModal isOpen={confirmLogout} onConfirm={() => { logout(); router.replace('/login') }} onCancel={() => setConfirmLogout(false)} />
    </div>
  )
}
