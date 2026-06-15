'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Lock } from 'lucide-react'
import { useAuthStore } from '@/modules/auth/infrastructure/stores/authStore'
import { LogoutModal } from '@/shared/ui/components/LogoutModal'

import teamDataRaw from '@/data/json/teams.json'

const teamData = teamDataRaw as { missionProgress: Record<string, string>; earnedFragments: string[] }

const completedCount = Object.values(teamData.missionProgress).filter(v => v === 'completed').length

const BADGES = [
  {
    id: 'b-1', icon: '🦅', name: 'Primer Vuelo', category: 'Inicio',
    desc: 'Completa tu primera misión', color: '#00a8ff',
    earned: completedCount >= 1,
  },
  {
    id: 'b-2', icon: '🏛️', name: 'Conocedor del Sillar', category: 'Capítulo 1',
    desc: 'Completa todas las misiones del Capítulo 1', color: '#F59E0B',
    earned: teamData.earnedFragments.includes('frag-sillar'),
  },
  {
    id: 'b-3', icon: '🌋', name: 'Domador del Misti', category: 'Capítulo 2',
    desc: 'Completa todas las misiones del Capítulo 2', color: '#EF4444',
    earned: teamData.earnedFragments.includes('frag-misti'),
  },
  {
    id: 'b-4', icon: '🌊', name: 'Guardián del Chili', category: 'Capítulo 3',
    desc: 'Completa todas las misiones del Capítulo 3', color: '#3B82F6',
    earned: teamData.earnedFragments.includes('frag-chili'),
  },
  {
    id: 'b-5', icon: '📜', name: 'Cronista de la Historia', category: 'Capítulo 4',
    desc: 'Completa todas las misiones del Capítulo 4', color: '#8B5CF6',
    earned: teamData.earnedFragments.includes('frag-historia'),
  },
  {
    id: 'b-6', icon: '🎭', name: 'Alma de la Ciudad', category: 'Capítulo 5',
    desc: 'Completa todas las misiones del Capítulo 5', color: '#10B981',
    earned: teamData.earnedFragments.includes('frag-cultura'),
  },
  {
    id: 'b-7', icon: '⚡', name: 'Racha de 5', category: 'Logros',
    desc: 'Completa 5 misiones consecutivas sin errores', color: '#f9bd22',
    earned: completedCount >= 5,
  },
  {
    id: 'b-8', icon: '📸', name: 'Fotógrafo Histórico', category: 'Logros',
    desc: 'Envía evidencia fotográfica en una misión de foto', color: '#C084FC',
    earned: Object.entries(teamData.missionProgress).some(([, v]) => v === 'completed' || v === 'review'),
  },
  {
    id: 'b-9', icon: '🔍', name: 'Detective Arequipeño', category: 'Logros',
    desc: 'Responde correctamente 10 trivias', color: '#38BDF8',
    earned: completedCount >= 10,
  },
  {
    id: 'b-10', icon: '🏆', name: 'Guardián de Arequipa', category: 'Especial',
    desc: 'Obtén todos los fragmentos de los 5 capítulos', color: '#f9bd22',
    earned: teamData.earnedFragments.length === 5,
  },
  {
    id: 'b-11', icon: '💎', name: 'Equipo Perfecto', category: 'Especial',
    desc: 'Completa todas las misiones del juego', color: '#00f0ff',
    earned: completedCount >= 24,
  },
  {
    id: 'b-12', icon: '🌟', name: 'Leyenda de Arequipa', category: 'Especial',
    desc: 'Ocupa el primer lugar en el ranking final', color: '#f9bd22',
    earned: false,
  },
]

const CATEGORIES = ['Inicio', 'Capítulo 1', 'Capítulo 2', 'Capítulo 3', 'Capítulo 4', 'Capítulo 5', 'Logros', 'Especial']

export default function InsigniasPage() {
  const router = useRouter()
  const { user, isHydrated, hydrate, logout } = useAuthStore()
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [filter, setFilter] = useState<string | null>(null)

  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => {
    if (isHydrated && !user) router.replace('/login')
  }, [user, isHydrated, router])

  if (!user) return null

  const earnedCount = BADGES.filter(b => b.earned).length
  const displayed   = filter ? BADGES.filter(b => b.category === filter) : BADGES

  return (
    <div className="min-h-screen" style={{ background: '#0d1117', fontFamily: 'var(--font-exo2), sans-serif' }}>

      {/* Header */}
      <div className="sticky top-0 z-30 glass-panel hud-scanline px-5 py-4 flex items-center gap-3"
        style={{ borderBottom: '1px solid rgba(0,240,255,0.15)' }}>
        <button onClick={() => router.push('/student/panel')}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#f9bd22' }}>Colección</p>
          <p className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-cinzel), serif' }}>Insignias y Logros</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(249,189,34,0.1)', border: '1px solid rgba(249,189,34,0.3)' }}>
          <span className="text-sm font-black" style={{ color: '#f9bd22' }}>{earnedCount}</span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>/ {BADGES.length}</span>
        </div>
      </div>

      <div className="px-5 pt-4 mx-auto max-w-7xl flex flex-col gap-4 pb-10 lg:px-8">

        {/* Progress bar */}
        <div className="glass-panel hud-scanline rounded-2xl p-4"
          style={{ border: '1px solid rgba(249,189,34,0.2)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#f9bd22' }}>Tu progreso</p>
            <p className="text-xs tabular-nums" style={{ color: 'rgba(255,255,255,0.4)' }}>{earnedCount} de {BADGES.length} insignias</p>
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="h-full rounded-full"
              style={{ width: `${(earnedCount / BADGES.length) * 100}%`, background: 'linear-gradient(90deg,#f9bd22,#ffd700)', boxShadow: '0 0 8px rgba(249,189,34,0.6)', transition: 'width 0.7s ease' }} />
          </div>
        </div>

        {/* Category filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
          <button onClick={() => setFilter(null)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{ background: !filter ? 'rgba(0,168,255,0.2)' : 'rgba(255,255,255,0.05)', border: !filter ? '1px solid rgba(0,168,255,0.5)' : '1px solid rgba(255,255,255,0.1)', color: !filter ? '#00f0ff' : 'rgba(255,255,255,0.4)' }}>
            Todas
          </button>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilter(cat === filter ? null : cat)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{ background: filter === cat ? 'rgba(0,168,255,0.2)' : 'rgba(255,255,255,0.05)', border: filter === cat ? '1px solid rgba(0,168,255,0.5)' : '1px solid rgba(255,255,255,0.1)', color: filter === cat ? '#00f0ff' : 'rgba(255,255,255,0.4)' }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Badge grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {displayed.map(b => (
            <div key={b.id} className="glass-panel hud-scanline rounded-2xl p-3 flex flex-col items-center gap-2"
              style={{
                border: b.earned ? `1px solid ${b.color}40` : '1px solid rgba(255,255,255,0.06)',
                background: b.earned ? `${b.color}0a` : undefined,
                boxShadow: b.earned ? `0 0 16px ${b.color}20` : 'none',
                opacity: b.earned ? 1 : 0.5,
              }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl relative"
                style={{
                  background: b.earned ? `${b.color}18` : 'rgba(255,255,255,0.04)',
                  border: b.earned ? `1.5px solid ${b.color}50` : '1.5px solid rgba(255,255,255,0.08)',
                }}>
                {b.earned ? <span>{b.icon}</span> : <Lock className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.2)' }} />}
              </div>
              <p className="text-[11px] font-bold text-center leading-tight" style={{ color: b.earned ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                {b.earned ? b.name : '???'}
              </p>
              <p className="text-[9px] text-center leading-tight" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {b.earned ? b.category : b.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <LogoutModal isOpen={confirmLogout} onConfirm={() => { logout(); router.replace('/login') }} onCancel={() => setConfirmLogout(false)} />
    </div>
  )
}
