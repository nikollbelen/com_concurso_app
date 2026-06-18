'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Trophy, Target, Users } from 'lucide-react'
import { useAuthStore } from '@/modules/auth/infrastructure/stores/authStore'
import { LogoutModal } from '@/shared/ui/components/LogoutModal'
import { supabase } from '@/shared/infrastructure/supabase/client'

// Tipos dinámicos para nuestra vista
type SchoolRanking = {
  id: string
  pos: number
  name: string
  short: string
  points: number
  missions: number
  teamsCount: number
}

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
  
  // Estados para Supabase
  const [schools, setSchools] = useState<SchoolRanking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => {
    if (isHydrated && !user) router.replace('/login')
  }, [user, isHydrated, router])

  // Fetch de Supabase
  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('id, name, short, points, missions_completed, teams(id)')
          .order('points', { ascending: false })

        if (error) throw error

        if (data) {
          const formattedData: SchoolRanking[] = data.map((s, index) => ({
            id: s.id,
            pos: index + 1,
            name: s.name,
            short: s.short,
            points: s.points,
            missions: s.missions_completed || 0,
            // Validación segura para el JOIN de Supabase
            teamsCount: Array.isArray(s.teams) ? s.teams.length : 0 
          }))
          setSchools(formattedData)
        }
      } catch (err) {
        console.error('Error cargando el ranking:', err)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchRanking()
    }
  }, [user])

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1117' }}>
        <p className="text-sm font-bold animate-pulse" style={{ color: '#00f0ff' }}>Sincronizando con la red de Guardianes...</p>
      </div>
    )
  }

  // Cálculos dinámicos basados en la BD
  const myPos = schools.find(s => s.id === user.schoolId)?.pos ?? 0
  const topXp = schools.length > 0 ? schools[0].points : 0
  const totalMissions = schools.reduce((a, s) => a + s.missions, 0)

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
            <p className="text-lg font-black tabular-nums" style={{ color: '#f9bd22' }}>{schools.length}</p>
            <p className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>colegios</p>
          </div>
        </div>

        {myPos > 0 && (
          <div className="relative group">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)' }}>
              <span className="text-xs font-bold" style={{ color: '#00f0ff' }}>Tu pos.</span>
              <span className="text-sm font-black" style={{ color: '#f9bd22' }}>#{myPos}</span>
            </div>
            <Tooltip text={`Tu colegio está en la posición #${myPos} de ${schools.length} colegios`} align="right" />
          </div>
        )}
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
            {schools.length >= 3 && ([schools[1], schools[0], schools[2]]).map((s, i) => {
              const posMap = [2, 1, 3] as const
              const rpos   = posMap[i]
              const m      = MEDAL[rpos]
              const heights = ['h-28', 'h-36', 'h-24']
              return (
                <div key={s.id} className={`flex flex-col items-center flex-1 ${heights[i]}`}>
                  <div className={`w-full flex-1 rounded-2xl flex flex-col items-center justify-center gap-1 px-2 py-3`}
                    style={{ background: m.bg, border: m.border, boxShadow: m.shadow }}>
                    <span className="text-2xl">{m.emoji}</span>
                    <p className="text-xs font-black text-white text-center leading-tight truncate w-full">{s.short}</p>
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
                { label: 'Colegios', value: schools.length, color: '#00f0ff' },
                { label: 'Misiones completadas', value: totalMissions, color: '#00e676' },
                { label: 'XP líder', value: `${topXp.toLocaleString('es-PE')}`, color: '#f9bd22' },
                { label: 'Tu posición', value: myPos > 0 ? `#${myPos}` : '-', color: '#00f0ff' },
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

          <div className="hidden md:grid gap-3 px-4 mb-1"
            style={{ gridTemplateColumns: '2.5rem 1fr 7rem 4.5rem 4rem' }}>
            <span />
            <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>Colegio</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-right" style={{ color: 'rgba(255,255,255,0.3)' }}>XP Total</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>Misiones</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>Equipos</span>
          </div>

          <div className="flex flex-col gap-2">
            {schools.map(s => {
              const isMe  = s.id === user.schoolId
              const pct   = topXp > 0 ? (s.points / topXp) * 100 : 0
              const medal = s.pos <= 3 ? MEDAL[s.pos as 1|2|3] : null
              return (
                <div key={s.id} className="glass-panel hud-scanline rounded-2xl px-4 py-3"
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
                      <span className="text-sm font-bold">{s.teamsCount}</span>
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