'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, CheckCircle, Clock, Lock, LogOut, ChevronLeft, Award, Trophy, Map } from 'lucide-react'
import { useAuthStore } from '@/modules/auth/infrastructure/stores/authStore'
import { LogoutModal } from '@/shared/ui/components/LogoutModal'

import chaptersRaw from '@/data/json/chapters.json'
import missionsRaw from '@/data/json/missions.json'
import teamDataRaw from '@/data/json/teams.json'

const teamData  = teamDataRaw  as { currentTeam: { level: number; levelTitle: string; points: number; nextLevelPoints: number; currentChapterId: string }; missionProgress: Record<string, string>; unlockedChapters: string[]; earnedFragments: string[] }
const chapters  = chaptersRaw  as { id: string; number: number; title: string; color: string; totalMissions: number; fragment: { id: string; name: string; icon: string } }[]
const missions  = missionsRaw  as { id: string; chapterId: string }[]

export default function StudentPanelPage() {
  const router = useRouter()
  const { user, isHydrated, hydrate, logout } = useAuthStore()
  const [confirmLogout, setConfirmLogout] = useState(false)

  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => {
    if (isHydrated && (!user || user.role !== 'student')) router.replace('/login')
  }, [user, isHydrated, router])

  if (!user) return null

  const { currentTeam, missionProgress, unlockedChapters, earnedFragments } = teamData
  const xpPercent = Math.min(100, Math.round((currentTeam.points / currentTeam.nextLevelPoints) * 100))

  const chapterStats = chapters.map(ch => {
    const total     = missions.filter(m => m.chapterId === ch.id).length
    const completed = missions.filter(m => m.chapterId === ch.id && missionProgress[m.id] === 'completed').length
    const review    = missions.filter(m => m.chapterId === ch.id && missionProgress[m.id] === 'review').length
    const locked    = !unlockedChapters.includes(ch.id)
    return { ...ch, total, completed, review, locked }
  })

  const totalCompleted = Object.values(missionProgress).filter(v => v === 'completed').length
  const totalReview    = Object.values(missionProgress).filter(v => v === 'review').length

  return (
    <div className="min-h-screen" style={{ background: '#0d1117', fontFamily: 'var(--font-exo2), sans-serif' }}>

      {/* ── Header ─────────────────────────────────────────── */}
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
            <p className="text-[10px] uppercase tracking-widest" style={{ color: '#00f0ff' }}>Mi Perfil</p>
            <p className="text-sm font-bold text-white">{user.name}</p>
          </div>
        </div>
        <button onClick={() => setConfirmLogout(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
          <LogOut className="w-3.5 h-3.5" /> Salir
        </button>
      </div>

      {/* ── Layout: mobile stack / desktop two-column ──────── */}
      <div className="mx-auto px-4 pt-5 pb-10 max-w-7xl lg:flex lg:gap-8 lg:items-start lg:px-8">

        {/* ══ Columna izquierda: perfil + stats + navegación ══ */}
        <div className="lg:w-80 xl:w-96 shrink-0 flex flex-col gap-4 lg:sticky lg:top-24">

          {/* XP card */}
          <div className="glass-panel hud-scanline rounded-2xl p-5"
            style={{ border: '1px solid rgba(0,240,255,0.2)', boxShadow: 'inset 0 0 20px rgba(0,240,255,0.04)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest font-bold" style={{ color: '#00f0ff' }}>
                  {user.levelTitle ?? `Nivel ${currentTeam.level}`}
                </p>
                <p className="text-3xl font-black text-white mt-0.5" style={{ fontFamily: 'var(--font-exo2), sans-serif' }}>
                  {currentTeam.points.toLocaleString('es-PE')} <span className="text-base font-bold" style={{ color: '#f9bd22' }}>XP</span>
                </p>
              </div>
              <div className="flex flex-col items-center px-3 py-2 rounded-2xl"
                style={{ background: 'linear-gradient(160deg,#00b4d8,#0077b6)', boxShadow: '0 4px 0 rgba(0,0,0,0.4), 0 0 16px rgba(0,240,255,0.3)' }}>
                <span className="text-[9px] uppercase tracking-widest text-white/60">NV</span>
                <span className="text-2xl font-black text-white leading-none">{currentTeam.level}</span>
              </div>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full relative overflow-hidden"
                style={{ width: `${xpPercent}%`, background: 'linear-gradient(90deg,#00a8ff,#00f0ff)', boxShadow: '0 0 8px rgba(0,240,255,0.7)', transition: 'width 0.7s ease' }}>
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent" style={{ animation: 'shimmer 2.5s infinite' }} />
              </div>
            </div>
            <p className="text-[11px] text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {currentTeam.points} / {currentTeam.nextLevelPoints} XP para nivel {currentTeam.level + 1}
            </p>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <CheckCircle className="w-4 h-4" />, label: 'Completadas', value: totalCompleted, color: '#00e676' },
              { icon: <Clock className="w-4 h-4" />,       label: 'En revisión', value: totalReview,    color: '#ff9800' },
              { icon: <Map className="w-4 h-4" />,         label: 'Capítulos',   value: unlockedChapters.length, color: '#00f0ff' },
            ].map(s => (
              <div key={s.label} className="glass-panel hud-scanline rounded-2xl p-3 text-center"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Accesos rápidos */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => router.push('/insignias')}
              className="glass-panel hud-scanline rounded-2xl p-4 flex items-center gap-3 text-left"
              style={{ border: '1px solid rgba(249,189,34,0.2)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(249,189,34,0.12)', border: '1px solid rgba(249,189,34,0.3)' }}>
                <Award className="w-4 h-4" style={{ color: '#f9bd22' }} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Insignias</p>
                <p className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Colección</p>
              </div>
            </button>
            <button onClick={() => router.push('/ranking')}
              className="glass-panel hud-scanline rounded-2xl p-4 flex items-center gap-3 text-left"
              style={{ border: '1px solid rgba(0,240,255,0.15)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.25)' }}>
                <Trophy className="w-4 h-4" style={{ color: '#00f0ff' }} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Ranking</p>
                <p className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>16 colegios</p>
              </div>
            </button>
          </div>
        </div>

        {/* ══ Columna derecha: fragmentos + capítulos ══ */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 mt-4 lg:mt-0">

          {/* Fragments */}
          <div className="glass-panel hud-scanline rounded-2xl p-5"
            style={{ border: '1px solid rgba(249,189,34,0.15)' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-widest font-bold" style={{ color: '#00f0ff' }}>
                Fragmentos del Guardián
              </p>
              <span className="text-xs font-bold tabular-nums" style={{ color: '#f9bd22' }}>
                {earnedFragments.length} / {chapters.length}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {chapters.map(ch => {
                const earned = earnedFragments.includes(ch.fragment.id)
                return (
                  <div key={ch.id} className="flex flex-col items-center gap-1.5">
                    <div className="w-full aspect-square rounded-2xl flex items-center justify-center relative"
                      style={{
                        background: earned ? `${ch.color}22` : 'rgba(255,255,255,0.04)',
                        border: earned ? `1.5px solid ${ch.color}60` : '1.5px solid rgba(255,255,255,0.08)',
                        boxShadow: earned ? `0 0 12px ${ch.color}40` : 'none',
                      }}>
                      <img
                        src={ch.fragment.icon}
                        alt={ch.fragment.name}
                        style={{
                          width: '82%',
                          height: '82%',
                          objectFit: 'contain',
                          filter: earned ? 'none' : 'grayscale(100%) brightness(0.35)',
                          transition: 'filter 0.3s ease',
                        }}
                      />
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
                    <p className="text-center leading-tight"
                      style={{ fontSize: 9, fontFamily: 'var(--font-exo2), sans-serif', color: earned ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }}>
                      {ch.fragment.name.replace('Fragmento ', '')}
                    </p>
                  </div>
                )
              })}
            </div>
            {earnedFragments.length < chapters.length && (
              <p className="text-[11px] mt-3 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Completa todas las misiones de un capítulo para obtener su fragmento
              </p>
            )}
            {earnedFragments.length === chapters.length && (
              <div className="mt-3 py-2 rounded-xl text-center text-xs font-bold uppercase tracking-wider"
                style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)', color: '#00e676' }}>
                ✨ ¡Eres un Guardián de Arequipa!
              </div>
            )}
          </div>

          {/* Chapter progress */}
          <div className="glass-panel hud-scanline rounded-2xl p-5"
            style={{ border: '1px solid rgba(0,240,255,0.12)' }}>
            <p className="text-xs uppercase tracking-widest font-bold mb-4" style={{ color: '#00f0ff' }}>
              Progreso por Capítulo
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {chapterStats.map(ch => {
                const pct = ch.total > 0 ? Math.round((ch.completed / ch.total) * 100) : 0
                return (
                  <div key={ch.id} className="rounded-2xl px-4 py-3"
                    style={{
                      background: ch.locked ? 'rgba(255,255,255,0.02)' : 'rgba(0,240,255,0.03)',
                      border: ch.locked ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,240,255,0.12)',
                      opacity: ch.locked ? 0.5 : 1,
                    }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {ch.locked
                          ? <Lock className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                          : <BookOpen className="w-3.5 h-3.5" style={{ color: '#00f0ff' }} />
                        }
                        <p className="text-sm font-bold text-white">{ch.title}</p>
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
