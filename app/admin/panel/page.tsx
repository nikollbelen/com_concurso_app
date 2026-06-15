'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, School, Users, Flag, BarChart2, LogOut, Settings } from 'lucide-react'
import { useAuthStore } from '@/modules/auth/infrastructure/stores/authStore'
import { LogoutModal } from '@/shared/ui/components/LogoutModal'

const QUICK_ACTIONS = [
  { icon: <School className="w-5 h-5" />,    label: 'Colegios',     count: '16',  color: '#00f0ff' },
  { icon: <Users className="w-5 h-5" />,     label: 'Equipos',      count: '32',  color: '#a855f7' },
  { icon: <Flag className="w-5 h-5" />,      label: 'Misiones',     count: '24',  color: '#f9bd22' },
  { icon: <BarChart2 className="w-5 h-5" />, label: 'Capítulos',    count: '5',   color: '#10b981' },
]

export default function AdminPanelPage() {
  const router = useRouter()
  const { user, isHydrated, hydrate, logout } = useAuthStore()
  const [confirmLogout, setConfirmLogout] = useState(false)

  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => {
    if (isHydrated && (!user || user.role !== 'admin')) router.replace('/login')
  }, [user, isHydrated, router])

  if (!user) return null

  return (
    <div className="min-h-screen" style={{ background: '#0d1117', fontFamily: 'var(--font-exo2), sans-serif' }}>

      {/* Header */}
      <div className="glass-panel hud-scanline px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(0,240,255,0.15)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 0 12px rgba(245,158,11,0.4)' }}>
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: '#f59e0b' }}>Panel Admin</p>
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

        {/* Event status */}
        <div className="glass-panel hud-scanline rounded-2xl p-4"
          style={{ border: '1px solid rgba(0,240,255,0.2)', boxShadow: 'inset 0 0 20px rgba(0,240,255,0.04)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest font-bold" style={{ color: '#00f0ff' }}>Estado del Evento</p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #4ade80' }} />
              <span className="text-xs font-bold" style={{ color: '#4ade80' }}>En curso</span>
            </div>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="h-full rounded-full" style={{ width: '35%', background: 'linear-gradient(90deg,#00a8ff,#00f0ff)' }} />
          </div>
          <p className="text-xs mt-1.5 text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>35% completado · 8 equipos activos</p>
        </div>

        {/* Quick stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map(a => (
            <div key={a.label} className="glass-panel hud-scanline rounded-2xl p-4 flex items-center gap-3"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${a.color}18`, border: `1px solid ${a.color}35`, color: a.color }}>
                {a.icon}
              </div>
              <div>
                <p className="text-2xl font-black text-white">{a.count}</p>
                <p className="text-[11px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{a.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Coming soon */}
        <div className="glass-panel hud-scanline rounded-2xl p-4 flex items-center gap-3"
          style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <Settings className="w-5 h-5 shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <div>
            <p className="text-sm font-bold text-white">Gestión completa próximamente</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              CRUD de colegios, equipos, misiones · tablero en vivo · exportar resultados
            </p>
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
