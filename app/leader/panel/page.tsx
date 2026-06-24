'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Clock, CheckCircle, XCircle, Users, LogOut, Map, Loader2, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/modules/auth/infrastructure/stores/authStore'
import { LogoutModal } from '@/shared/ui/components/LogoutModal'
import { supabase } from '@/shared/infrastructure/supabase/client'

interface PendingMission {
  id: string
  photo: string | null
  created_at: string
  mission_title: string
  mission_points: number | null
  mission_type: string | null
}

interface TeamMember {
  id: string
  name: string
  alias: string
}

interface TeamData {
  team_id: number
  team_name: string
  level: number | null
  points: number | null
  color: string | null
  school_id: string
  school_name: string
  members: TeamMember[]
  earned_fragments: string[]
}

type PageState = 'loading-auth' | 'loading-data' | 'no-team' | 'error' | 'ready'

export default function LeaderPanelPage() {
  const router = useRouter()
  const { user, isHydrated, hydrate, logout } = useAuthStore()
  const [confirmLogout, setConfirmLogout] = useState(false)

  const [pageState, setPageState] = useState<PageState>('loading-auth')
  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [pendingMissions, setPendingMissions] = useState<PendingMission[]>([])
  const [missionsApprovedCount, setMissionsApprovedCount] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => { hydrate() }, [hydrate])

  const loadData = useCallback(async () => {
    setPageState('loading-data')
    setErrorMessage(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('team_id')
        .eq('id', session.user.id)
        .single()

      const teamId = (usuario as { team_id: number | null } | null)?.team_id
      if (!teamId) { setPageState('no-team'); return }

      const [teamResult, pendingResult, completedResult] = await Promise.all([
        supabase
          .from('vista_equipos_completos')
          .select('*')
          .eq('team_id', teamId)
          .single(),
        supabase
          .from('mission_progression')
          .select('id, photo, created_at, missions!inner(title, points, type)')
          .eq('team_id', teamId)
          .eq('status' as never, 'review'),
        supabase
          .from('mission_progression')
          .select('id', { count: 'exact', head: true })
          .eq('team_id', teamId)
          .eq('status' as never, 'completed'),
      ])

      if (teamResult.error) throw teamResult.error
      setTeamData(teamResult.data as unknown as TeamData)

      setPendingMissions(
        (pendingResult.data ?? []).map((item) => {
          const m = item as unknown as {
            id: string
            photo: string | null
            created_at: string
            missions: { title: string; points: number | null; type: string | null }
          }
          return {
            id: m.id,
            photo: m.photo,
            created_at: m.created_at,
            mission_title: m.missions.title,
            mission_points: m.missions.points,
            mission_type: m.missions.type,
          }
        }),
      )

      setMissionsApprovedCount(completedResult.count ?? 0)
      setPageState('ready')
    } catch (e) {
      console.error('[LeaderPanel]', e)
      setErrorMessage('Error al cargar los datos. Intenta de nuevo.')
      setPageState('error')
    }
  }, [router])

  useEffect(() => {
    if (!isHydrated) return
    if (!user || user.role !== 'leader') { router.replace('/login'); return }
    loadData()
  }, [isHydrated, user, router, loadData])

  const handleApprove = async (progressionId: string) => {
    setPendingMissions((prev) => prev.filter((m) => m.id !== progressionId))
    setMissionsApprovedCount((prev) => prev + 1)

    const { error } = await (supabase as any)
      .from('mission_progression')
      .update({ status: 'completed' })
      .eq('id', progressionId)

    if (error) { console.error(error); loadData(); return }

    if (teamData) {
      const { data } = await supabase
        .from('vista_equipos_completos')
        .select('*')
        .eq('team_id', teamData.team_id)
        .single()
      if (data) setTeamData(data as unknown as TeamData)
    }
  }

  const handleReject = async (progressionId: string) => {
    setPendingMissions((prev) => prev.filter((m) => m.id !== progressionId))

    const { error } = await (supabase as any)
      .from('mission_progression')
      .update({ status: 'rejected' })
      .eq('id', progressionId)

    if (error) { console.error(error); loadData() }
  }

  if (pageState === 'loading-auth' || pageState === 'loading-data') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1117' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: '#00f0ff' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {pageState === 'loading-auth' ? 'Verificando sesión...' : 'Cargando panel...'}
          </p>
        </div>
      </div>
    )
  }

  if (pageState === 'no-team') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0d1117' }}>
        <div
          className="glass-panel hud-scanline rounded-3xl p-8 max-w-md text-center"
          style={{ border: '1px solid rgba(255,149,0,0.2)' }}
        >
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: '#FF9800' }} />
          <p className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
            Acceso Restringido
          </p>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Aún no has sido asignado a un equipo. Espera a que dirección/admin te asigne a una escuadra para comenzar a gestionar misiones.
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

  if (pageState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0d1117' }}>
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: '#ff6b6b' }}>{errorMessage}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.2)', color: '#00f0ff' }}
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const memberCount = teamData?.members?.length ?? 0

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
            <p className="text-sm font-bold text-white">{user!.name}</p>
            {teamData?.school_name && (
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{teamData.school_name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/mapa')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)', color: '#00f0ff' }}
          >
            <Map className="w-3.5 h-3.5" /> Ver mapa
          </button>
          <button
            onClick={() => setConfirmLogout(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
          >
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>
      </div>

      <div className="p-5 max-w-6xl mx-auto">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'En revisión', value: pendingMissions.length, color: '#FF9800', icon: <Clock className="w-5 h-5" /> },
            { label: 'Equipo activo', value: memberCount, color: '#00f0ff', icon: <Users className="w-5 h-5" /> },
            { label: 'Aprobadas', value: missionsApprovedCount, color: '#00E676', icon: <CheckCircle className="w-5 h-5" /> },
            { label: 'Nivel', value: teamData?.level ?? '—', color: '#a855f7', icon: <BookOpen className="w-5 h-5" /> },
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

        <div className="grid lg:grid-cols-[1fr_340px] gap-5">

          <div>
            <p className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: '#00f0ff' }}>
              Evidencias pendientes
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
              {pendingMissions.map((m) => (
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
                  <p className="text-sm font-bold text-white mb-0.5">{m.mission_title}</p>
                  <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {teamData?.team_name} · {m.mission_points ?? '?'} pts
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(m.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
                      style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', boxShadow: '0 4px 0 rgba(0,0,0,0.2)' }}
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Aprobar
                    </button>
                    <button
                      onClick={() => handleReject(m.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
                      style={{ background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.3)', color: '#ff6b6b' }}
                    >
                      <XCircle className="w-3.5 h-3.5" /> Rechazar
                    </button>
                  </div>
                </div>
              ))}

              {pendingMissions.length === 0 && (
                <div
                  className="glass-panel hud-scanline rounded-2xl p-6 text-center sm:col-span-2"
                  style={{ border: '1px solid rgba(0,230,118,0.2)' }}
                >
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#00E676' }} />
                  <p className="text-sm font-bold text-white">Todo al día</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>No hay evidencias pendientes</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-widest font-bold" style={{ color: '#00f0ff' }}>
              Tu equipo
            </p>

            <div
              className="glass-panel hud-scanline rounded-2xl p-4"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Equipo asignado
              </p>
              <p className="text-sm font-bold text-white mb-1" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
                {teamData?.team_name ?? '—'}
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {memberCount} alumnos · Nivel {teamData?.level ?? '?'}
                {teamData?.points != null && ` · ${teamData.points} XP`}
              </p>
            </div>

            {teamData?.members && teamData.members.length > 0 && (
              <div
                className="glass-panel hud-scanline rounded-2xl p-4"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Integrantes
                </p>
                <div className="space-y-2">
                  {teamData.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between">
                      <span className="text-sm text-white">{m.name}</span>
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>@{m.alias}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              className="glass-panel hud-scanline rounded-2xl p-4"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}
            >
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
