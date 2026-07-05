'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, CheckCircle, Clock, Lock, LogOut, ChevronLeft, Trophy, Map as MapIcon, Shield, ListTodo, Crown, Users } from 'lucide-react'
import { useAuthStore } from '@/modules/auth/infrastructure/stores/authStore'
import { LogoutModal } from '@/shared/ui/components/LogoutModal'
import { useStudentDashboard } from '@/modules/teams/presentation/hooks/useStudentDashboard'
import { Tooltip } from '@/shared/ui/components/Tooltip'

export default function StudentPanelPage() {
  const router = useRouter()
  const { user, isHydrated, hydrate, logout } = useAuthStore()
  const [confirmLogout, setConfirmLogout] = useState(false)

  const teamId = user?.teamId
  const { data: dashboard, isLoading } = useStudentDashboard(teamId)

  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => {
    if (isHydrated && (!user || user.role !== 'student')) router.replace('/login')
  }, [user, isHydrated, router])

  if (!isHydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1117' }}>
        <p className="text-sm font-bold animate-pulse text-cyan-400">Sincronizando datos en vivo...</p>
      </div>
    )
  }

  // Pantalla de protección si no tiene equipo asignado
  if (teamId == null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: '#0d1117', fontFamily: 'var(--font-exo2), sans-serif' }}>
        <div className="glass-panel p-8 rounded-3xl max-w-md border border-red-500/30">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-white uppercase tracking-wider mb-2">Sin Equipo Asignado</h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Contacta a tu profesor guía para que te asigne a un equipo. Cuando lo haga, recarga esta página y entrarás automáticamente.
          </p>
          <button onClick={() => setConfirmLogout(true)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold transition-all mx-auto">
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
        <LogoutModal isOpen={confirmLogout} onConfirm={() => { logout(); router.replace('/login') }} onCancel={() => setConfirmLogout(false)} />
      </div>
    )
  }

  if (isLoading || !dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1117' }}>
        <p className="text-sm font-bold animate-pulse text-cyan-400">Sincronizando datos en vivo...</p>
      </div>
    )
  }

  const chapters = dashboard.chapters
  const { teamName, members, totalCompleted, totalReview, totalPending, totalMissions, totalSchools } = dashboard

  // Umbral del siguiente nivel: 100% desde el catálogo `levels` (BD). null = nivel tope.
  const nextLevelPoints = dashboard.nextLevelPoints
  const isMaxLevel = nextLevelPoints === null
  const xpPercent = nextLevelPoints === null
    ? 100
    : Math.min(100, Math.round((dashboard.points / nextLevelPoints) * 100))
  const unlockedChaptersCount = chapters.filter(c => !c.locked).length

  return (
    <div className="min-h-screen" style={{ background: '#0d1117', fontFamily: 'var(--font-exo2), sans-serif' }}>

      {/* ── Header Original ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 glass-panel hud-scanline px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(0,240,255,0.15)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/mapa')}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg text-white"
            style={{ background: `linear-gradient(135deg, ${user.color}dd, ${user.color})`, boxShadow: `0 0 12px ${user.color}55`, fontFamily: 'var(--font-exo2), sans-serif' }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest truncate max-w-[45vw]" style={{ color: '#00f0ff' }}>
              Equipo · {teamName}
            </p>
            <p className="text-sm font-bold text-white truncate max-w-[45vw]">{user.name}</p>
          </div>
        </div>
        <button onClick={() => setConfirmLogout(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
          <LogOut className="w-3.5 h-3.5" /> Salir
        </button>
      </div>

      {/* ── Layout Original: mobile stack / desktop two-column ──────── */}
      <div className="mx-auto px-4 pt-5 pb-10 max-w-[1600px] lg:flex lg:gap-8 lg:items-start lg:px-8 xl:px-12 xl:gap-10">

        {/* ══ Columna izquierda: perfil + stats + navegación ══ */}
        <div className="lg:w-88 xl:w-104 shrink-0 flex flex-col gap-4 lg:sticky lg:top-24">

          {/* XP card */}
          <div className="glass-panel hud-scanline rounded-2xl p-5"
            style={{ border: '1px solid rgba(0,240,255,0.2)', boxShadow: 'inset 0 0 20px rgba(0,240,255,0.04)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="relative group hover:z-50">
                <p className="text-xs uppercase tracking-widest font-bold" style={{ color: '#00f0ff' }}>
                  {dashboard.levelTitle}
                </p>
                <p className="text-3xl font-black text-white mt-0.5" style={{ fontFamily: 'var(--font-exo2), sans-serif' }}>
                  {dashboard.points.toLocaleString('es-PE')} <span className="text-base font-bold" style={{ color: '#f9bd22' }}>XP</span>
                </p>
                <Tooltip text={`Puntos de experiencia (XP) que ha ganado tu equipo completando misiones. Tu rango actual es «${dashboard.levelTitle}».`} align="left" />
              </div>
              <div className="relative group hover:z-50 flex flex-col items-center px-3 py-2 rounded-2xl"
                style={{ background: 'linear-gradient(160deg,#00b4d8,#0077b6)', boxShadow: '0 4px 0 rgba(0,0,0,0.4), 0 0 16px rgba(0,240,255,0.3)' }}>
                <span className="text-[9px] uppercase tracking-widest text-white/60">NV</span>
                <span className="text-2xl font-black text-white leading-none">{dashboard.level}</span>
                <Tooltip text={isMaxLevel
                  ? 'Nivel máximo del concurso: ya no hay un nivel superior.'
                  : `Tu nivel actual. Alcanza ${nextLevelPoints?.toLocaleString('es-PE')} XP para subir al nivel ${dashboard.level + 1}.`} align="right" />
              </div>
            </div>
            <div className="relative group hover:z-50">
              <div className="w-full h-2.5 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div className="h-full rounded-full relative overflow-hidden"
                  style={{ width: `${xpPercent}%`, background: 'linear-gradient(90deg,#00a8ff,#00f0ff)', boxShadow: '0 0 8px rgba(0,240,255,0.7)', transition: 'width 0.7s ease' }}>
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent" style={{ animation: 'shimmer 2.5s infinite' }} />
                </div>
              </div>
              <p className="text-[11px] text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {nextLevelPoints === null
                  ? '¡Nivel máximo alcanzado!'
                  : `${dashboard.points} / ${nextLevelPoints} XP para nivel ${dashboard.level + 1}`}
              </p>
              <Tooltip
                text={nextLevelPoints === null
                  ? 'Has alcanzado el nivel máximo. ¡Eres una leyenda de Arequipa!'
                  : `Llevas ${xpPercent}% del camino al nivel ${dashboard.level + 1}. Te faltan ${(nextLevelPoints - dashboard.points).toLocaleString('es-PE')} XP.`}
                align="center"
              />
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <CheckCircle className="w-4 h-4" />, label: 'Completadas', value: totalCompleted, color: '#00e676', tip: 'Misiones que tu equipo ya completó y fueron aprobadas.' },
              { icon: <Clock className="w-4 h-4" />,       label: 'En revisión', value: totalReview,    color: '#ff9800', tip: 'Misiones enviadas que tu docente aún está revisando.' },
              { icon: <ListTodo className="w-4 h-4" />,    label: 'Faltan',      value: totalPending,   color: '#f44336', tip: `Misiones que tu equipo aún no completa (de ${totalMissions} en total).` },
              { icon: <MapIcon className="w-4 h-4" />,     label: 'Capítulos',   value: unlockedChaptersCount, color: '#00f0ff', tip: 'Capítulos que ya tienes desbloqueados para jugar.' },
            ].map((s, i) => (
              <div key={s.label} className="relative group hover:z-50 glass-panel hud-scanline rounded-2xl p-3 text-center"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
                <Tooltip text={s.tip} align={i % 2 === 0 ? 'left' : 'right'} />
              </div>
            ))}
          </div>

          {/* Accesos rápidos */}
          <div className="grid grid-cols-1 gap-3">
            <button onClick={() => router.push('/ranking')}
              className="relative group hover:z-50 glass-panel hud-scanline rounded-2xl p-4 flex items-center gap-3 text-left w-full cursor-pointer"
              style={{ border: '1px solid rgba(0,240,255,0.15)' }}>
              <Tooltip text={`Mira la tabla de posiciones: compites con ${totalSchools} colegios de Arequipa.`} align="center" />
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.25)' }}>
                <Trophy className="w-4 h-4" style={{ color: '#00f0ff' }} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Ranking</p>
                <p className="text-[9px] uppercase tracking-wider tabular-nums" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {totalSchools} colegios
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* ══ Columna derecha: mi equipo + fragmentos + capítulos ══ */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 mt-4 lg:mt-0">

          {/* Mi Equipo */}
          <div className="glass-panel hud-scanline rounded-2xl p-5" style={{ border: '1px solid rgba(0,240,255,0.15)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="relative group hover:z-50 flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: '#00f0ff' }} />
                <p className="text-xs uppercase tracking-widest font-bold" style={{ color: '#00f0ff' }}>Mi Equipo</p>
                <Tooltip text={`Integrantes de «${teamName}». La corona marca a tu docente guía.`} align="left" />
              </div>
              <span className="relative group hover:z-50 text-xs font-bold tabular-nums" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {members.length}
                <Tooltip text={`Tu equipo tiene ${members.length} ${members.length === 1 ? 'integrante' : 'integrantes'}.`} align="right" />
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {members.map(m => {
                const isMe = m.id === user.id
                return (
                  <div key={m.id} className="flex items-center gap-3 rounded-xl px-3 py-2"
                    style={{
                      background: isMe ? 'rgba(0,240,255,0.08)' : 'rgba(255,255,255,0.03)',
                      border: isMe ? '1px solid rgba(0,240,255,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white shrink-0"
                      style={{ background: m.isLeader ? 'linear-gradient(135deg,#f9bd22,#f59e0b)' : 'linear-gradient(135deg,#00b4d8,#0077b6)' }}>
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{m.name}</p>
                      <p className="text-[9px] uppercase tracking-wider" style={{ color: m.isLeader ? '#f9bd22' : 'rgba(255,255,255,0.35)' }}>
                        {m.isLeader ? 'Docente guía' : 'Alumno'}
                      </p>
                    </div>
                    {m.isLeader && <Crown className="w-4 h-4 shrink-0" style={{ color: '#f9bd22' }} />}
                    {isMe && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md shrink-0"
                        style={{ background: 'rgba(0,240,255,0.15)', color: '#00f0ff' }}>Tú</span>
                    )}
                  </div>
                )
              })}
              {members.length === 0 && (
                <p className="text-[11px] text-center py-2 sm:col-span-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Aún no hay integrantes registrados.
                </p>
              )}
            </div>
          </div>

          {/* Fragments */}
          <div className="glass-panel hud-scanline rounded-2xl p-5"
            style={{ border: '1px solid rgba(249,189,34,0.15)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="relative group hover:z-50">
                <p className="text-xs uppercase tracking-widest font-bold" style={{ color: '#00f0ff' }}>
                  Fragmentos del Guardián
                </p>
                <Tooltip text="Cada capítulo esconde un fragmento del Guardián. Reúnelos todos para completar la leyenda." align="left" />
              </div>
              <span className="relative group hover:z-50 text-xs font-bold tabular-nums" style={{ color: '#f9bd22' }}>
                {dashboard.earnedFragments.length} / {chapters.length}
                <Tooltip text={`Has reunido ${dashboard.earnedFragments.length} de ${chapters.length} fragmentos.`} align="right" />
              </span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {chapters.map((ch, i) => {
                const earned = ch.fragmentId ? dashboard.earnedFragments.includes(ch.fragmentId) : false
                const col = i % 5
                const tipAlign = col === 0 ? 'left' : col === 4 ? 'right' : 'center'
                const tipText = ch.fragmentName
                  ? earned
                    ? `${ch.fragmentName} — ¡conseguido! Lo ganaste al completar el capítulo «${ch.title}».`
                    : `${ch.fragmentName} — bloqueado. Completa el capítulo «${ch.title}» para obtenerlo.`
                  : 'Fragmento bloqueado. Avanza en la historia para descubrirlo.'
                return (
                  <div key={ch.id} className="relative group hover:z-50 flex flex-col items-center gap-1.5">
                    <div className="w-full aspect-square rounded-2xl flex items-center justify-center relative"
                      style={{
                        background: earned ? `${ch.color}22` : 'rgba(255,255,255,0.04)',
                        border: earned ? `1.5px solid ${ch.color}60` : '1.5px solid rgba(255,255,255,0.08)',
                        boxShadow: earned ? `0 0 12px ${ch.color}40` : 'none',
                      }}>
                      {ch.fragmentIcon && (
                        <img
                          src={ch.fragmentIcon}
                          alt={ch.fragmentName}
                          style={{
                            width: '82%',
                            height: '82%',
                            objectFit: 'contain',
                            filter: earned ? 'none' : 'grayscale(100%) brightness(0.35)',
                            transition: 'filter 0.3s ease',
                          }}
                        />
                      )}
                      {!earned && (
                        <div className="absolute inset-0 flex items-end justify-end p-1.5">
                          <Lock className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
                        </div>
                      )}
                      {earned && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                          style={{ background: '#00e676', boxShadow: '0 0 6px rgba(0,230,118,0.7)' }}>
                          <CheckCircle className="w-2.5 h-2.5 text-black" />
                        </div>
                      )}
                    </div>
                    <p className="text-center leading-tight truncate w-full"
                      style={{ fontSize: 9, fontFamily: 'var(--font-exo2), sans-serif', color: earned ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }}>
                      {ch.fragmentName ? ch.fragmentName.replace('Fragmento ', '') : 'Bloqueado'}
                    </p>
                    <Tooltip text={tipText} align={tipAlign} />
                  </div>
                )
              })}
            </div>
            {dashboard.earnedFragments.length < chapters.length && (
              <p className="text-[11px] mt-3 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Completa todas las misiones de un capítulo para obtener su fragmento
              </p>
            )}
            {dashboard.earnedFragments.length === chapters.length && dashboard.earnedFragments.length > 0 && (
              <div className="mt-3 py-2 rounded-xl text-center text-xs font-bold uppercase tracking-wider"
                style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)', color: '#00e676' }}>
                ✨ ¡Eres un Guardián de Arequipa!
              </div>
            )}
          </div>

          {/* Chapter progress */}
          <div className="glass-panel hud-scanline rounded-2xl p-5"
            style={{ border: '1px solid rgba(0,240,255,0.12)' }}>
            <div className="relative group hover:z-50 inline-block mb-4">
              <p className="text-xs uppercase tracking-widest font-bold" style={{ color: '#00f0ff' }}>
                Progreso por Capítulo
              </p>
              <Tooltip text="Avance de tu equipo en cada capítulo de la historia. Los capítulos bloqueados se abren al avanzar." align="left" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {chapters.map(ch => {
                const pct = ch.total > 0 ? Math.round((ch.completed / ch.total) * 100) : 0
                return (
                  <div key={ch.id} className="relative group hover:z-50 rounded-2xl px-4 py-3"
                    style={{
                      background: ch.locked ? 'rgba(255,255,255,0.02)' : 'rgba(0,240,255,0.03)',
                      border: ch.locked ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,240,255,0.12)',
                      opacity: ch.locked ? 0.5 : 1,
                    }}>
                    <Tooltip
                      text={ch.locked
                        ? `«${ch.title}» está bloqueado. Completa el capítulo anterior para desbloquearlo.`
                        : `«${ch.title}»: ${ch.completed} de ${ch.total} misiones completadas (${pct}%).`}
                      align="left"
                    />
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {ch.locked
                          ? <Lock className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                          : <BookOpen className="w-3.5 h-3.5" style={{ color: '#00f0ff' }} />
                        }
                        <p className="text-sm font-bold text-white truncate w-32">{ch.title}</p>
                      </div>
                      <span className="text-xs font-black tabular-nums" style={{ color: ch.locked ? 'rgba(255,255,255,0.3)' : '#f9bd22' }}>
                        {ch.completed}/{ch.total}
                      </span>
                    </div>
                    {!ch.locked && (
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#00a8ff,#00f0ff)', transition: 'width 0.7s ease' }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <LogoutModal
        isOpen={confirmLogout}
        onConfirm={() => { logout(); router.replace('/login') }}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  )
}