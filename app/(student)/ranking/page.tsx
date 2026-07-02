'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Target, Users, AlertTriangle, RefreshCw, Trophy } from 'lucide-react'
import { useAuthStore } from '@/modules/auth/infrastructure/stores/authStore'
import { useSchoolRanking } from '@/modules/schools/presentation/hooks/useSchoolRanking'

type SchoolRanking = {
  id: string
  pos: number | null   // null = aún sin puntos → sin puesto asignado
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

function SchoolRow({ school, isMe, topXp }: { school: SchoolRanking; isMe: boolean; topXp: number }) {
  const pct = topXp > 0 ? (school.points / topXp) * 100 : 0
  const medal = school.pos !== null && school.pos <= 3 ? MEDAL[school.pos as 1 | 2 | 3] : null

  return (
    <div className="glass-panel hud-scanline rounded-2xl px-4 py-3"
      style={{
        border: isMe ? '1px solid rgba(0,240,255,0.4)' : '1px solid rgba(255,255,255,0.07)',
        boxShadow: isMe ? '0 0 16px rgba(0,240,255,0.1)' : 'none',
      }}>
      <div className="flex items-center gap-3">
        <span className="text-base font-black w-7 text-center shrink-0"
          style={{ color: medal ? medal.color : 'rgba(255,255,255,0.25)' }}>
          {medal ? medal.emoji : (school.pos ?? '—')}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-bold text-white truncate">{school.name}</p>
            {isMe && <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(0,240,255,0.15)', color: '#00f0ff', border: '1px solid rgba(0,240,255,0.3)' }}>Tu colegio</span>}
          </div>
          <div className="w-full h-1 rounded-full mt-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: isMe ? 'linear-gradient(90deg,#00a8ff,#00f0ff)' : 'rgba(255,255,255,0.2)', transition: 'width 0.7s ease' }} />
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="relative group text-right">
            <p className="text-sm font-black tabular-nums" style={{ color: '#f9bd22' }}>{school.points.toLocaleString('es-PE')}</p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>XP total</p>
            <Tooltip text="Suma de XP de todos los equipos del colegio" align="right" />
          </div>
          <div className="relative group flex items-center justify-center gap-1.5 min-w-[3rem]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <Target className="w-3.5 h-3.5 shrink-0" />
            <span className="text-sm font-bold">{school.missions}</span>
            <Tooltip text="Misiones completadas en total" align="center" />
          </div>
          <div className="relative group flex items-center justify-center gap-1.5 min-w-[2.5rem]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="text-sm font-bold">{school.teamsCount}</span>
            <Tooltip text="Equipos participantes de este colegio" align="right" />
          </div>
        </div>
        <div className="shrink-0 text-right md:hidden">
          <p className="text-sm font-black tabular-nums" style={{ color: '#f9bd22' }}>{school.points.toLocaleString('es-PE')}</p>
          <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>XP</p>
        </div>
      </div>
    </div>
  )
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`rounded-xl animate-pulse ${className ?? ''}`} style={{ background: 'rgba(255,255,255,0.06)' }} />
}

export default function RankingPage() {
  const router = useRouter()
  const { user, isHydrated, hydrate } = useAuthStore()
  const { data: rankingData = [], isLoading: loading, isError, refetch } = useSchoolRanking()

  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => {
    if (isHydrated && !user) router.replace('/login')
  }, [user, isHydrated, router])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1117' }}>
        <p className="text-sm font-bold animate-pulse" style={{ color: '#00f0ff' }}>Sincronizando con la red de Guardianes...</p>
      </div>
    )
  }

  // Mapea la entidad de dominio a la forma que consume esta vista.
  // El puesto se asigna SOLO a colegios con puntos > 0 (los demás quedan sin puesto).
  let rank = 0
  const schools: SchoolRanking[] = rankingData.map(s => ({
    id: s.id,
    pos: s.points > 0 ? ++rank : null,
    name: s.name,
    short: s.short,
    points: s.points,
    missions: s.missionsCompleted,
    teamsCount: s.totalTeams,
  }))
  const error = isError
    ? 'No pudimos conectar con la red de Guardianes. Verifica tu conexión e intenta nuevamente.'
    : null

  const hasStarted    = schools.some(s => s.pos !== null)   // ¿ya puntuó alguien?
  const rankedSchools = schools.filter(s => s.pos !== null)
  const hasSchool     = user.schoolId != null               // el admin no tiene colegio
  const myPos = hasSchool ? (schools.find(s => s.id === user.schoolId)?.pos ?? null) : null
  const topXp = schools.length > 0 ? schools[0].points : 0
  const totalMissions = schools.reduce((a, s) => a + s.missions, 0)
  const top3 = rankedSchools.length >= 3 ? [rankedSchools[1], rankedSchools[0], rankedSchools[2]] : []

  const summaryStats: { label: string; value: string | number; color: string }[] = [
    { label: 'Colegios', value: schools.length, color: '#00f0ff' },
    { label: 'Misiones completadas', value: totalMissions, color: '#00e676' },
    { label: 'XP líder', value: hasStarted ? topXp.toLocaleString('es-PE') : '—', color: '#f9bd22' },
    ...(hasSchool ? [{ label: 'Tu posición', value: myPos != null ? `#${myPos}` : '—', color: '#00f0ff' }] : []),
  ]

  return (
    <div className="min-h-screen" style={{ background: '#0d1117', fontFamily: 'var(--font-exo2), sans-serif' }}>

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

        {hasSchool && myPos != null && (
          <div className="relative group hidden sm:block">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)' }}>
              <span className="text-xs font-bold" style={{ color: '#00f0ff' }}>Tu pos.</span>
              <span className="text-sm font-black" style={{ color: '#f9bd22' }}>#{myPos}</span>
            </div>
            <Tooltip text={`Tu colegio está en la posición #${myPos} de ${schools.length} colegios`} align="right" />
          </div>
        )}
      </div>

      <div className="mx-auto px-4 pt-6 pb-10 max-w-7xl lg:flex lg:gap-8 lg:items-start lg:px-8">

        <div className="lg:w-80 xl:w-96 shrink-0 lg:sticky lg:top-24">

          {hasStarted && top3.length === 3 && (
            <>
              <p className="text-xs uppercase tracking-[0.2em] font-bold mb-4 text-center" style={{ color: '#f9bd22' }}>
                ── Top 3 ──
              </p>
              <div className="flex items-end justify-center gap-3 mb-6">
                {top3.map((s, i) => {
                  const posMap = [2, 1, 3] as const
                  const rpos = posMap[i]
                  const m = MEDAL[rpos]
                  const heights = ['min-h-[112px]', 'min-h-[144px]', 'min-h-[96px]']
                  return (
                    <div key={s.id} className={`flex flex-col items-center flex-1 ${heights[i]}`}>
                      <div className="w-full flex-1 rounded-2xl flex flex-col items-center justify-center gap-1 px-2 py-3"
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
            </>
          )}

          {!loading && !error && !hasStarted && (
            <div className="glass-panel hud-scanline rounded-2xl p-5 mb-4 text-center"
              style={{ border: '1px solid rgba(0,240,255,0.2)' }}>
              <Trophy className="w-9 h-9 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.25)' }} />
              <p className="text-sm font-black text-white mb-1" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
                El concurso aún no comienza
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Ningún equipo ha puntuado todavía. Cuando completen misiones, aquí aparecerá la clasificación.
              </p>
            </div>
          )}

          <div className="glass-panel hud-scanline rounded-2xl p-4 mb-4"
            style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: '#00f0ff' }}>Resumen del evento</p>
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-[60px]" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {summaryStats.map(stat => (
                  <div key={stat.label} className="rounded-xl p-2.5 text-center"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-lg font-black" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-widest font-bold mb-3 mt-6 lg:mt-0" style={{ color: '#00f0ff' }}>
            Todos los colegios
          </p>

          {error ? (
            <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.2)' }}>
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: '#ff4444' }} />
              <p className="text-sm font-bold mb-3" style={{ color: '#ff6666' }}>{error}</p>
              <button onClick={() => refetch()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff6666' }}>
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </button>
            </div>
          ) : loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Skeleton className="w-7 h-5" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-1.5" />
                    <Skeleton className="h-1 w-full" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : schools.length === 0 ? (
            <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Aún no hay datos de clasificación.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {schools.map(s => (
                <SchoolRow key={s.id} school={s} isMe={s.id === user.schoolId} topXp={topXp} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
