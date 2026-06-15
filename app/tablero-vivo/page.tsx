'use client'

import { useEffect, useState } from 'react'
import { Trophy, Target, Users, Zap } from 'lucide-react'

// Mock data — reemplazar con fetch a Supabase cuando esté disponible
const SCHOOLS_MOCK = [
  { id: 's-01', name: 'I.E. Independencia Americana', short: 'Independencia', points: 1820, missions: 18, teams: 2, color: '#f9bd22' },
  { id: 's-02', name: 'I.E. La Salle',                short: 'La Salle',      points: 1640, missions: 16, teams: 2, color: '#94a3b8' },
  { id: 's-03', name: 'I.E. San Francisco',           short: 'San Francisco',  points: 1250, missions: 12, teams: 2, color: '#cd7f32' },
  { id: 's-04', name: 'I.E. Santa Rosa',              short: 'Santa Rosa',    points: 1100, missions: 11, teams: 2, color: '#94a3b8' },
  { id: 's-05', name: 'I.E. Gran Unidad Escolar',     short: 'Gran Unidad',   points: 980,  missions: 10, teams: 2, color: '#94a3b8' },
  { id: 's-06', name: 'I.E. Padre Damián de Veuster', short: 'Padre Damián',  points: 870,  missions: 9,  teams: 1, color: '#94a3b8' },
  { id: 's-07', name: 'I.E. Glorioso Guzmán',         short: 'Guzmán',        points: 760,  missions: 8,  teams: 2, color: '#94a3b8' },
  { id: 's-08', name: 'I.E. Miguel Grau',             short: 'Miguel Grau',   points: 640,  missions: 7,  teams: 1, color: '#94a3b8' },
  { id: 's-09', name: 'I.E. Honorio Delgado',         short: 'H. Delgado',    points: 540,  missions: 6,  teams: 1, color: '#94a3b8' },
  { id: 's-10', name: 'I.E. Aplicación',              short: 'Aplicación',    points: 420,  missions: 5,  teams: 1, color: '#94a3b8' },
  { id: 's-11', name: 'I.E. Manuel Muñoz Najar',      short: 'M. Najar',      points: 310,  missions: 4,  teams: 1, color: '#94a3b8' },
  { id: 's-12', name: 'I.E. Andrés Avelino Cáceres',  short: 'A. Cáceres',    points: 230,  missions: 3,  teams: 1, color: '#94a3b8' },
  { id: 's-13', name: 'I.E. Jorge Basadre',           short: 'J. Basadre',    points: 160,  missions: 2,  teams: 1, color: '#94a3b8' },
  { id: 's-14', name: 'I.E. Próceres',                short: 'Próceres',      points: 90,   missions: 1,  teams: 1, color: '#94a3b8' },
  { id: 's-15', name: 'I.E. Francisco Bolognesi',     short: 'Bolognesi',     points: 40,   missions: 1,  teams: 1, color: '#94a3b8' },
  { id: 's-16', name: 'I.E. Túpac Amaru II',          short: 'Túpac Amaru',   points: 0,    missions: 0,  teams: 1, color: '#94a3b8' },
]

const EVENT_NAME   = 'La Búsqueda de los Guardianes de Arequipa'
const TOTAL_MISSIONS = 24

export default function TableroVivoPage() {
  const [tick, setTick] = useState(0)
  const [time, setTime] = useState('')

  // Simula actualización en vivo cada 30s (en producción sería una suscripción Supabase)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    updateTime()
    const interval = setInterval(() => {
      updateTime()
      setTick(t => t + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const sorted = [...SCHOOLS_MOCK].sort((a, b) => b.points - a.points)
  const topXp  = sorted[0]?.points ?? 1
  const totalMissionsCompleted = sorted.reduce((acc, s) => acc + s.missions, 0)

  const MEDAL: Record<number, { emoji: string; color: string; bg: string }> = {
    1: { emoji: '🥇', color: '#f9bd22', bg: 'rgba(249,189,34,0.12)' },
    2: { emoji: '🥈', color: '#CBD5E1', bg: 'rgba(203,213,225,0.08)' },
    3: { emoji: '🥉', color: '#c87533', bg: 'rgba(200,117,51,0.1)' },
  }

  return (
    <div className="min-h-screen overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,168,255,0.07) 0%, #0d1117 60%)', fontFamily: 'var(--font-exo2), sans-serif' }}>

      {/* HUD grid lines decorativas */}
      <div className="fixed inset-0 pointer-events-none" style={{ opacity: 0.025,
        backgroundImage: 'linear-gradient(rgba(0,240,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,1) 1px,transparent 1px)',
        backgroundSize: '60px 60px' }} />

      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-10 py-5"
        style={{ borderBottom: '1px solid rgba(0,240,255,0.12)', background: 'rgba(13,17,23,0.8)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#f9bd22,#ff9800)', boxShadow: '0 0 20px rgba(249,189,34,0.4)' }}>
            <Trophy className="w-6 h-6 text-black" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-bold" style={{ color: '#00f0ff' }}>Tablero en vivo</p>
            <p className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-cinzel), serif', lineHeight: 1.2 }}>
              {EVENT_NAME}
            </p>
          </div>
        </div>

        {/* Stats globales */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-3xl font-black tabular-nums" style={{ color: '#f9bd22' }}>{SCHOOLS_MOCK.length}</p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>colegios</p>
          </div>
          <div className="w-px h-10" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div className="text-center">
            <p className="text-3xl font-black tabular-nums" style={{ color: '#00f0ff' }}>{totalMissionsCompleted}</p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>misiones totales</p>
          </div>
          <div className="w-px h-10" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div className="text-center">
            <p className="text-3xl font-black tabular-nums" style={{ color: '#00e676' }}>{TOTAL_MISSIONS}</p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>misiones del juego</p>
          </div>
          <div className="w-px h-10" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div className="text-center">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: '#00e676', boxShadow: '0 0 6px #00e676', animation: 'pulse 1.5s infinite' }} />
              <p className="text-base font-bold tabular-nums text-white">{time}</p>
            </div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>en vivo</p>
          </div>
        </div>
      </header>

      {/* ── PODIO ───────────────────────────────────────────── */}
      <section className="relative z-10 px-10 pt-8 pb-4">
        <p className="text-xs uppercase tracking-[0.3em] font-bold mb-6 text-center" style={{ color: '#f9bd22' }}>
          ── Líderes del torneo ──
        </p>
        <div className="flex items-end justify-center gap-6 max-w-3xl mx-auto">
          {[sorted[1], sorted[0], sorted[2]].map((s, idx) => {
            if (!s) return null
            const realPos  = [2, 1, 3][idx]
            const heights  = ['h-32', 'h-44', 'h-28']
            const medal    = MEDAL[realPos]
            return (
              <div key={s.id} className={`flex flex-col items-center flex-1 ${heights[idx]}`}>
                {realPos === 1 && (
                  <p className="text-[11px] uppercase tracking-[0.15em] font-bold mb-2 animate-pulse" style={{ color: '#f9bd22' }}>
                    Líder
                  </p>
                )}
                <div className={`w-full flex-1 rounded-3xl flex flex-col items-center justify-center gap-1 px-3 py-4`}
                  style={{
                    background: medal.bg,
                    border: `1.5px solid ${medal.color}50`,
                    boxShadow: realPos === 1 ? `0 0 32px ${medal.color}30, inset 0 0 20px ${medal.color}10` : 'none',
                  }}>
                  <span className="text-3xl">{medal.emoji}</span>
                  <p className="text-base font-black text-white text-center leading-tight">{s.short}</p>
                  <p className="text-2xl font-black tabular-nums" style={{ color: medal.color }}>
                    {s.points.toLocaleString('es-PE')}
                  </p>
                  <p className="text-[11px] uppercase tracking-wider" style={{ color: `${medal.color}99` }}>XP</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      <Target className="w-3 h-3" />
                      <span className="text-xs font-bold">{s.missions}</span>
                    </div>
                    <div className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      <Users className="w-3 h-3" />
                      <span className="text-xs font-bold">{s.teams}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── TABLA COMPLETA ──────────────────────────────────── */}
      <section className="relative z-10 px-10 pb-10">
        {/* Cabecera tabla */}
        <div className="grid gap-3 px-4 mb-2" style={{ gridTemplateColumns: '2.5rem 1fr 8rem 5rem 4rem' }}>
          <span />
          <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>Colegio</span>
          <span className="text-[10px] uppercase tracking-widest font-bold text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>XP Total</span>
          <span className="text-[10px] uppercase tracking-widest font-bold text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>Misiones</span>
          <span className="text-[10px] uppercase tracking-widest font-bold text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>Equipos</span>
        </div>

        <div className="flex flex-col gap-2">
          {sorted.slice(3).map((s, idx) => {
            const pos = idx + 4
            const pct = topXp > 0 ? (s.points / topXp) * 100 : 0
            return (
              <div key={s.id}
                className="glass-panel hud-scanline rounded-2xl px-4 py-3"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="grid items-center gap-3" style={{ gridTemplateColumns: '2.5rem 1fr 8rem 5rem 4rem' }}>
                  {/* Posición */}
                  <span className="text-lg font-black text-center tabular-nums"
                    style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {pos}
                  </span>
                  {/* Nombre + barra */}
                  <div>
                    <p className="text-sm font-bold text-white truncate">{s.name}</p>
                    <div className="w-full h-1 rounded-full mt-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: 'rgba(0,168,255,0.5)', transition: 'width 1s ease' }} />
                    </div>
                  </div>
                  {/* XP */}
                  <p className="text-lg font-black text-center tabular-nums" style={{ color: '#f9bd22' }}>
                    {s.points.toLocaleString('es-PE')}
                  </p>
                  {/* Misiones */}
                  <div className="flex items-center justify-center gap-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <Target className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-sm font-bold">{s.missions}</span>
                  </div>
                  {/* Equipos */}
                  <div className="flex items-center justify-center gap-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-sm font-bold">{s.teams}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Footer branding */}
      <footer className="relative z-10 text-center pb-6" style={{ color: 'rgba(255,255,255,0.15)' }}>
        <p className="text-xs uppercase tracking-[0.3em]">Municipalidad Provincial de Arequipa · {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
