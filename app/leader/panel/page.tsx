'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Clock, CheckCircle, XCircle, Users, LogOut, Map } from 'lucide-react'
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

      {/* ── Header ── */}
      <div className="glass-panel hud-scanline px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(0,240,255,0.15)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)', boxShadow: '0 0 12px rgba(168,85,247,0.4)' }}>
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: '#a855f7' }}>Panel Docente</p>
            <p className="text-sm font-bold text-white">{user.name}</p>
            {user.schoolName && (
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{user.schoolName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/mapa')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)', color: '#00f0ff' }}>
            <Map className="w-3.5 h-3.5" /> Ver mapa
          </button>
          <button onClick={() => setConfirmLogout(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-5 max-w-6xl mx-auto">

        {/* Stats row — always full width, 4 cols on lg */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'En revisión',  value: PENDING_MISSIONS.length, color: '#FF9800', icon: <Clock       className="w-5 h-5" /> },
            { label: 'Equipo activo', value: 1,                      color: '#00f0ff', icon: <Users       className="w-5 h-5" /> },
            { label: 'Aprobadas hoy', value: 3,                      color: '#00E676', icon: <CheckCircle className="w-5 h-5" /> },
            { label: 'Rechazadas',   value: 0,                       color: '#546E7A', icon: <XCircle     className="w-5 h-5" /> },
          ].map(s => (
            <div key={s.label} className="glass-panel hud-scanline rounded-2xl p-4"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-2 mb-1" style={{ color: s.color }}>
                {s.icon}
                <span className="text-xs uppercase tracking-wider font-bold">{s.label}</span>
              </div>
              <p className="text-3xl font-black text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Two-column on desktop */}
        <div className="grid lg:grid-cols-[1fr_340px] gap-5">

          {/* Left: pending missions */}
          <div>
            <p className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: '#00f0ff' }}>
              Evidencias pendientes
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
              {PENDING_MISSIONS.map(m => (
                <div key={m.id} className="glass-panel hud-scanline rounded-2xl p-4"
                  style={{ border: '1px solid rgba(255,149,0,0.2)' }}>
                  <p className="text-sm font-bold text-white mb-0.5">{m.mission}</p>
                  <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>{m.team} · {m.points} pts</p>
                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
                      style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', boxShadow: '0 4px 0 rgba(0,0,0,0.2)' }}>
                      <CheckCircle className="w-3.5 h-3.5" /> Aprobar
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
                      style={{ background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.3)', color: '#ff6b6b' }}>
                      <XCircle className="w-3.5 h-3.5" /> Rechazar
                    </button>
                  </div>
                </div>
              ))}

              {PENDING_MISSIONS.length === 0 && (
                <div className="glass-panel hud-scanline rounded-2xl p-6 text-center sm:col-span-2"
                  style={{ border: '1px solid rgba(0,230,118,0.2)' }}>
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#00E676' }} />
                  <p className="text-sm font-bold text-white">Todo al día</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>No hay evidencias pendientes</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: info sidebar */}
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-widest font-bold" style={{ color: '#00f0ff' }}>
              Tu equipo
            </p>

            <div className="glass-panel hud-scanline rounded-2xl p-4"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Equipo asignado
              </p>
              <p className="text-sm font-bold text-white mb-1" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
                Los Cóndores del Sillar
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>5 alumnos · Nivel 2</p>
            </div>

            <div className="glass-panel hud-scanline rounded-2xl p-4"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-sm font-bold text-white mb-1">Más funciones próximamente</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Historial de aprobaciones, mensajes al equipo, progreso por misión
              </p>
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
