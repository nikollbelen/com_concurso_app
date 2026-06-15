'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Clock, CheckCircle, XCircle, Users, LogOut } from 'lucide-react'
import { useAuthStore } from '@/modules/auth/infrastructure/stores/authStore'
import { LogoutModal } from '@/shared/ui/components/LogoutModal'

const PENDING_MISSIONS = [
  { id: 'm-1', team: 'Los Cóndores del Sillar', mission: 'Fotografía en la Catedral de Arequipa', type: 'photo', points: 15 },
  { id: 'm-2', team: 'Los Cóndores del Sillar', mission: 'Evidencia en el Monasterio de Santa Catalina', type: 'photo', points: 15 },
]

export default function LeaderPanelPage() {
  const router = useRouter()
  const { user, isHydrated, hydrate, logout } = useAuthStore()
  const [confirmLogout, setConfirmLogout] = useState(false)

  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => {
    if (isHydrated && (!user || user.role !== 'leader')) router.replace('/login')
  }, [user, isHydrated, router])

  if (!user) return null

  return (
    <div className="min-h-screen" style={{ background: '#0d1117', fontFamily: 'var(--font-exo2), sans-serif' }}>

      {/* Header */}
      <div className="glass-panel hud-scanline px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(0,240,255,0.15)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)', boxShadow: '0 0 12px rgba(168,85,247,0.4)' }}>
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: '#a855f7' }}>Panel Docente</p>
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

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'En revisión', value: PENDING_MISSIONS.length, color: '#ff9500', icon: <Clock className="w-5 h-5" /> },
            { label: 'Equipo activo', value: 1, color: '#00f0ff', icon: <Users className="w-5 h-5" /> },
          ].map(s => (
            <div key={s.label} className="glass-panel hud-scanline rounded-2xl p-4"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-2 mb-1" style={{ color: s.color }}>
                {s.icon}
                <span className="text-xs uppercase tracking-wider font-bold">{s.label}</span>
              </div>
              <p className="text-3xl font-black text-white" style={{ fontFamily: 'var(--font-exo2)' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Pending reviews */}
        <div>
          <p className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: '#00f0ff' }}>
            Evidencias pendientes
          </p>
          <div className="flex flex-col gap-2">
            {PENDING_MISSIONS.map(m => (
              <div key={m.id} className="glass-panel hud-scanline rounded-2xl p-4"
                style={{ border: '1px solid rgba(255,149,0,0.2)' }}>
                <p className="text-sm font-bold text-white mb-0.5">{m.mission}</p>
                <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>{m.team} · {m.points} pts</p>
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
                    style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', boxShadow: '0 4px 0 rgba(0,0,0,0.2)' }}>
                    <CheckCircle className="w-3.5 h-3.5" /> Aprobar
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
                    style={{ background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.3)', color: '#ff6b6b' }}>
                    <XCircle className="w-3.5 h-3.5" /> Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel hud-scanline rounded-2xl p-4 text-center"
          style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-sm font-bold text-white mb-1">Más funciones próximamente</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Vista de equipo, historial de aprobaciones, mensajes al equipo
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
