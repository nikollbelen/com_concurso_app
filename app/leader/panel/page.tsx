'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Clock, CheckCircle, XCircle, Users, LogOut, Loader2, AlertTriangle, Shield } from 'lucide-react'
import { useAuthStore } from '@/modules/auth/infrastructure/stores/authStore'
import { LogoutModal } from '@/shared/ui/components/LogoutModal'
import { useLeaderReviewData, useLeaderSetMissionStatus } from '@/modules/missions/presentation/hooks/useReviewData'

export default function LeaderPanelPage() {
  const router = useRouter()
  const { user, isHydrated, hydrate, logout } = useAuthStore()
  const [confirmLogout, setConfirmLogout] = useState(false)

  const leaderId = user?.id
  const { data, isLoading, isError, refetch } = useLeaderReviewData(leaderId)
  const setStatus = useLeaderSetMissionStatus(leaderId)

  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => {
    if (isHydrated && (!user || user.role !== 'leader')) router.replace('/login')
  }, [isHydrated, user, router])

  const handleApprove = (id: string) => setStatus.mutate({ id, status: 'completed' })
  const handleReject  = (id: string) => setStatus.mutate({ id, status: 'rejected' })

  /* ─ guards ─ */
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1117' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: '#00f0ff' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Verificando sesión...</p>
        </div>
      </div>
    )
  }
  if (!user || user.role !== 'leader') return null

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1117' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: '#00f0ff' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Cargando panel...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0d1117' }}>
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: '#ff6b6b' }}>Error al cargar los datos. Intenta de nuevo.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.2)', color: '#00f0ff' }}
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const teams = data ?? []

  /* Sin equipos asignados: el docente aún no lidera ninguna escuadra */
  if (teams.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0d1117' }}>
        <div
          className="glass-panel hud-scanline rounded-3xl p-8 max-w-md text-center"
          style={{ border: '1px solid rgba(255,149,0,0.2)' }}
        >
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: '#FF9800' }} />
          <p className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
            Sin equipos asignados
          </p>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Aún no lideras ninguna escuadra. Espera a que dirección/admin te asigne uno o más equipos para comenzar a revisar evidencias.
          </p>
          <button
            onClick={() => { logout(); router.replace('/login') }}
            className="px-6 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  /* Agregados de todos los equipos que lidera el docente */
  const totalPending  = teams.reduce((n, t) => n + t.pending.length, 0)
  const totalApproved = teams.reduce((n, t) => n + t.approvedCount, 0)
  const totalStudents = teams.reduce((n, t) => n + (t.team.members?.length ?? 0), 0)

  return (
    <div className="min-h-screen" style={{ background: '#0d1117', fontFamily: 'var(--font-exo2), sans-serif' }}>

      <div
        className="glass-panel hud-scanline px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(0,240,255,0.15)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)', boxShadow: '0 0 12px rgba(168,85,247,0.4)' }}
          >
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
        <button
          onClick={() => setConfirmLogout(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
        >
          <LogOut className="w-3.5 h-3.5" /> Salir
        </button>
      </div>

      <div className="p-5 max-w-6xl mx-auto">

        {/* Stats agregadas de todos los equipos que lidera */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Equipos', value: teams.length, color: '#a855f7', icon: <Shield className="w-5 h-5" /> },
            { label: 'En revisión', value: totalPending, color: '#FF9800', icon: <Clock className="w-5 h-5" /> },
            { label: 'Aprobadas', value: totalApproved, color: '#00E676', icon: <CheckCircle className="w-5 h-5" /> },
            { label: 'Alumnos', value: totalStudents, color: '#00f0ff', icon: <Users className="w-5 h-5" /> },
          ].map((s) => (
            <div
              key={s.label}
              className="glass-panel hud-scanline rounded-2xl p-4"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="flex items-center gap-2 mb-1" style={{ color: s.color }}>
                {s.icon}
                <span className="text-xs uppercase tracking-wider font-bold">{s.label}</span>
              </div>
              <p className="text-3xl font-black text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Una sección por equipo liderado */}
        <div className="flex flex-col gap-6">
          {teams.map(({ team, pending, approvedCount }) => {
            const accent = team.color ?? '#a855f7'
            return (
              <section key={team.teamId}>

                {/* Cabecera del equipo */}
                <div
                  className="glass-panel hud-scanline rounded-2xl p-4 mb-3 flex items-center justify-between gap-3 flex-wrap"
                  style={{ border: `1px solid ${accent}40`, borderLeft: `4px solid ${accent}` }}
                >
                  <div className="min-w-0">
                    <p className="text-base font-bold text-white truncate" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
                      {team.teamName}
                    </p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {team.schoolName} · {team.members?.length ?? 0} alumnos · Nivel {team.level ?? '?'}
                      {team.points != null && ` · ${team.points} XP`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                      style={{ background: 'rgba(255,149,0,0.12)', border: '1px solid rgba(255,149,0,0.3)', color: '#FF9800' }}
                    >
                      <Clock className="w-3.5 h-3.5" /> {pending.length} pendientes
                    </span>
                    <span
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                      style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.25)', color: '#00E676' }}
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> {approvedCount} aprobadas
                    </span>
                  </div>
                </div>

                {/* Evidencias pendientes del equipo */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pending.map((m) => (
                    <div
                      key={m.id}
                      className="glass-panel hud-scanline rounded-2xl p-4"
                      style={{ border: '1px solid rgba(255,149,0,0.2)' }}
                    >
                      {m.photo && (
                        <img
                          src={m.photo}
                          alt="Evidencia"
                          className="w-full h-36 object-cover rounded-xl mb-3"
                          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                        />
                      )}
                      <p className="text-sm font-bold text-white mb-0.5">{m.missionTitle}</p>
                      <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {m.missionPoints ?? '?'} pts
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(m.id)}
                          disabled={setStatus.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', boxShadow: '0 4px 0 rgba(0,0,0,0.2)' }}
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Aprobar
                        </button>
                        <button
                          onClick={() => handleReject(m.id)}
                          disabled={setStatus.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                          style={{ background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.3)', color: '#ff6b6b' }}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Rechazar
                        </button>
                      </div>
                    </div>
                  ))}

                  {pending.length === 0 && (
                    <div
                      className="glass-panel hud-scanline rounded-2xl p-6 text-center sm:col-span-2 lg:col-span-3"
                      style={{ border: '1px solid rgba(0,230,118,0.2)' }}
                    >
                      <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#00E676' }} />
                      <p className="text-sm font-bold text-white">Todo al día</p>
                      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Este equipo no tiene evidencias pendientes</p>
                    </div>
                  )}
                </div>
              </section>
            )
          })}
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
