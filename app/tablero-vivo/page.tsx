'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Trophy, Target, Users, ChevronLeft } from 'lucide-react'
import { useSchoolRanking } from '@/modules/schools/presentation/hooks/useSchoolRanking'

const EVENT_NAME   = 'La Búsqueda de los Guardianes de Arequipa'

const MEDAL: Record<number, { emoji: string; color: string; bg: string }> = {
  1: { emoji: '🥇', color: '#f9bd22', bg: 'rgba(249,189,34,0.12)' },
  2: { emoji: '🥈', color: '#CBD5E1', bg: 'rgba(203,213,225,0.08)' },
  3: { emoji: '🥉', color: '#c87533', bg: 'rgba(200,117,51,0.1)' },
}

export default function TableroVivoPage() {
  const router = useRouter()
  const [time, setTime] = useState('')

  // Datos reales de Supabase, con auto-refresco cada 30s (tablero "en vivo")
  const { data: ranking = [] } = useSchoolRanking({ refetchInterval: 30000 })

  // Reloj en vivo
  useEffect(() => {
    const updateTime = () =>
      setTime(new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // El ranking ya viene ordenado por puntos desc, con puesto (null si aún sin puntos)
  const schools = ranking.map(s => ({
    id: s.id,
    name: s.name,
    short: s.short,
    points: s.points,
    missions: s.missionsCompleted,
    teams: s.totalTeams,
    pos: s.rankingPosition,
  }))

  const hasStarted = schools.some(s => s.pos !== null)
  const ranked = schools.filter(s => s.pos !== null)
  const topXp = schools[0]?.points ?? 0

  const podium = hasStarted && ranked.length >= 3 ? [ranked[1], ranked[0], ranked[2]] : []
  const tableSchools = podium.length > 0 ? schools.slice(3) : schools

  return (
    <div className="min-h-screen overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,168,255,0.07) 0%, #0d1117 60%)', fontFamily: 'var(--font-exo2), sans-serif' }}>

      {/* HUD grid lines decorativas */}
      <div className="fixed inset-0 pointer-events-none" style={{ opacity: 0.025,
        backgroundImage: 'linear-gradient(rgba(0,240,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,1) 1px,transparent 1px)',
        backgroundSize: '60px 60px' }} />

      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5"
        style={{ borderBottom: '1px solid rgba(0,240,255,0.12)', background: 'rgba(13,17,23,0.8)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={() => router.push('/')}
            aria-label="Volver al inicio"
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,#f9bd22,#ff9800)', boxShadow: '0 0 20px rgba(249,189,34,0.4)' }}>
            <Trophy className="w-6 h-6 text-black" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-bold" style={{ color: '#00f0ff' }}>Tablero en vivo</p>
            <p className="text-base md:text-xl font-black text-white" style={{ fontFamily: 'var(--font-cinzel), serif', lineHeight: 1.2 }}>
              {EVENT_NAME}
            </p>
          </div>
        </div>

        {/* Stats globales */}
        <div className="hidden sm:flex items-center gap-6">
          <div className="text-center">
            <p className="text-3xl font-black tabular-nums" style={{ color: '#f9bd22' }}>{schools.length}</p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>colegios</p>
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

      {/* ── PODIO / ESTADO ──────────────────────────────────── */}
      {podium.length > 0 ? (
        <section className="relative z-10 px-6 md:px-10 pt-8 pb-4">
          <p className="text-xs uppercase tracking-[0.3em] font-bold mb-6 text-center" style={{ color: '#f9bd22' }}>
            ── Líderes del torneo ──
          </p>
          <div className="flex items-end justify-center gap-4 md:gap-6 max-w-3xl mx-auto">
            {podium.map((s, idx) => {
              if (!s) return null
              const realPos = [2, 1, 3][idx]
              const heights = ['h-32', 'h-44', 'h-28']
              const medal   = MEDAL[realPos]
              return (
                <div key={s.id} className={`flex flex-col items-center flex-1 ${heights[idx]}`}>
                  {realPos === 1 && (
                    <p className="text-[11px] uppercase tracking-[0.15em] font-bold mb-2 animate-pulse" style={{ color: '#f9bd22' }}>
                      Líder
                    </p>
                  )}
                  <div className="w-full flex-1 rounded-3xl flex flex-col items-center justify-center gap-1 px-3 py-4"
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
      ) : (
        <section className="relative z-10 px-6 md:px-10 pt-10 pb-4">
          <div className="glass-panel hud-scanline rounded-3xl max-w-2xl mx-auto py-10 px-6 text-center"
            style={{ border: '1px solid rgba(0,240,255,0.2)' }}>
            <Trophy className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.25)' }} />
            <p className="text-xl font-black text-white mb-1" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
              El concurso aún no comienza
            </p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Ningún equipo ha puntuado todavía. Cuando los equipos completen misiones, aquí aparecerá la clasificación en vivo.
            </p>
          </div>
        </section>
      )}

      {/* ── TABLA COMPLETA ──────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-10 pb-10">
        <div className="grid gap-3 px-4 mb-2" style={{ gridTemplateColumns: '2.5rem 1fr 8rem 5rem 4rem' }}>
          <span />
          <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>Colegio</span>
          <span className="text-[10px] uppercase tracking-widest font-bold text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>XP Total</span>
          <span className="text-[10px] uppercase tracking-widest font-bold text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>Misiones</span>
          <span className="text-[10px] uppercase tracking-widest font-bold text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>Equipos</span>
        </div>

        <div className="flex flex-col gap-2">
          {tableSchools.map(s => {
            const pct = topXp > 0 ? (s.points / topXp) * 100 : 0
            return (
              <div key={s.id}
                className="glass-panel hud-scanline rounded-2xl px-4 py-3"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="grid items-center gap-3" style={{ gridTemplateColumns: '2.5rem 1fr 8rem 5rem 4rem' }}>
                  <span className="text-lg font-black text-center tabular-nums" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {s.pos ?? '—'}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white truncate">{s.name}</p>
                    <div className="w-full h-1 rounded-full mt-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: 'rgba(0,168,255,0.5)', transition: 'width 1s ease' }} />
                    </div>
                  </div>
                  <p className="text-lg font-black text-center tabular-nums" style={{ color: '#f9bd22' }}>
                    {s.points.toLocaleString('es-PE')}
                  </p>
                  <div className="flex items-center justify-center gap-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <Target className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-sm font-bold">{s.missions}</span>
                  </div>
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

      {/* Footer branding — patrocinadores */}
      <footer className="relative z-10 flex flex-col items-center gap-1 pb-6 select-none">
        <span className="uppercase tracking-widest opacity-50"
          style={{ fontFamily: 'var(--font-exo2), sans-serif', fontSize: 9, letterSpacing: '0.12em', color: 'var(--color-on-surface-var)' }}>
          Powered by
        </span>
        <div className="flex items-center gap-2 opacity-80">
          <Image src="/images/patrocinadores/logo_yuki.png" alt="Yuki" width={36} height={36} className="object-contain" style={{ width: 'auto', height: 30 }} />
          <Image src="/images/patrocinadores/citrus.png" alt="Citrus" width={36} height={36} className="object-contain" style={{ width: 'auto', height: 30 }} />
        </div>
      </footer>
    </div>
  )
}
