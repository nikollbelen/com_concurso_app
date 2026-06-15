'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Trophy, TrendingUp, Users, LogOut } from 'lucide-react'
import { useAuthStore } from '@/modules/auth/infrastructure/stores/authStore'
import { LogoutModal } from '@/shared/ui/components/LogoutModal'

const SCHOOL_RANKING = [
  { pos: 1, name: 'Colegio Independencia Americana', points: 1250, teams: 2 },
  { pos: 2, name: 'Colegio La Salle',                points: 1100, teams: 2 },
  { pos: 3, name: 'Colegio San Francisco',           points: 980,  teams: 2 },
  { pos: 4, name: 'Colegio Santa Rosa',              points: 820,  teams: 1 },
]

export default function DirectorPanelPage() {
  const router = useRouter()
  const { user, isHydrated, hydrate, logout } = useAuthStore()
  const [confirmLogout, setConfirmLogout] = useState(false)

  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => {
    if (isHydrated && (!user || user.role !== 'director')) router.replace('/login')
  }, [user, isHydrated, router])

  if (!user) return null

  return (
    <div className="min-h-screen" style={{ background: '#0d1117', fontFamily: 'var(--font-exo2), sans-serif' }}>

      {/* Header */}
      <div className="glass-panel hud-scanline px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(0,240,255,0.15)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 0 12px rgba(16,185,129,0.4)' }}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: '#10b981' }}>Panel Director</p>
            <p className="text-sm font-bold text-white">{user.name}</p>
          </div>
        </div>
        <button onClick={() => setConfirmLogout(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
          <LogOut className="w-3.5 h-3.5" /> Salir
        </button>
      </div>

      <div className="p-5 max-w-lg mx-auto flex flex-col gap-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Equipos', value: '2', color: '#00f0ff', icon: <Users className="w-4 h-4" /> },
            { label: 'Posición', value: '#1',  color: '#f9bd22', icon: <Trophy className="w-4 h-4" /> },
            { label: 'Puntos', value: '1,250', color: '#10b981', icon: <TrendingUp className="w-4 h-4" /> },
          ].map(s => (
            <div key={s.label} className="glass-panel hud-scanline rounded-2xl p-3 text-center"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
              <p className="text-xl font-black text-white">{s.value}</p>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Ranking */}
        <div>
          <p className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: '#00f0ff' }}>
            Ranking de Colegios
          </p>
          <div className="flex flex-col gap-2">
            {SCHOOL_RANKING.map(s => (
              <div key={s.pos} className="glass-panel hud-scanline rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ border: s.pos === 1 ? '1px solid rgba(249,189,34,0.3)' : '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-xl font-black w-8 text-center"
                  style={{ color: s.pos === 1 ? '#f9bd22' : s.pos === 2 ? '#94a3b8' : s.pos === 3 ? '#cd7f32' : 'rgba(255,255,255,0.3)' }}>
                  #{s.pos}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{s.name}</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.teams} equipos</p>
                </div>
                <span className="font-black text-sm shrink-0" style={{ color: '#f9bd22' }}>
                  {s.points.toLocaleString()} pts
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel hud-scanline rounded-2xl p-4 text-center"
          style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-sm font-bold text-white mb-1">Más funciones próximamente</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Progreso por equipo, capítulos completados, exportar reporte
          </p>
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
