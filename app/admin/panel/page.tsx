'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck, LogOut, Map, School, Users, Flag, BarChart2,
  Trophy, CheckCircle, Clock, ChevronDown, ChevronUp,
  GraduationCap, X, Building2,
} from 'lucide-react'
import { useAuthStore } from '@/modules/auth/infrastructure/stores/authStore'
import { LogoutModal } from '@/shared/ui/components/LogoutModal'
import schoolsRaw from '@/data/json/schools.json'

/* ── types ─────────────────────────────────────────────────── */

interface SchoolTeam {
  id: string; name: string; color: string
  level: number; levelTitle: string; points: number
  missionsCompleted: number; missionsInReview: number
  leader: string; members: string[]
}
interface School {
  id: string; name: string; director: string
  rankingPosition: number; totalPoints: number; missionsCompleted: number
  teams: SchoolTeam[]
}
interface SchoolsData {
  ranking: { position: number; name: string; points: number; teams: number; missionsCompleted: number }[]
  schools: School[]
  eventStats: { totalSchools: number; totalTeams: number; totalMissionsCompleted: number }
}

const schoolsData = schoolsRaw as unknown as SchoolsData

const POSITION_COLOR = (pos: number) =>
  pos === 1 ? '#FFD600' : pos === 2 ? '#9E9E9E' : pos === 3 ? '#CD7F32' : 'rgba(255,255,255,0.25)'

/* ── TeamDetail ─────────────────────────────────────────────── */

function TeamDetail({ team }: { team: SchoolTeam }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: `${team.color}0d`, border: `1px solid ${team.color}25` }}>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white shrink-0"
            style={{ background: `linear-gradient(135deg, ${team.color}cc, ${team.color})` }}>
            {team.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white leading-tight truncate" style={{ fontFamily: 'var(--font-cinzel), serif' }}>{team.name}</p>
            <p className="text-[9px]" style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.35)' }}>
              {team.levelTitle} · NV {team.level}
            </p>
          </div>
          <span className="text-xs font-black tabular-nums shrink-0"
            style={{ fontFamily: 'var(--font-exo2), sans-serif', color: '#f9bd22' }}>
            {team.points.toLocaleString('es-PE')} XP
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl mb-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <GraduationCap className="w-3 h-3 shrink-0" style={{ color: '#00f0ff' }} />
          <span className="text-[10px] font-semibold truncate" style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.6)' }}>
            {team.leader}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)' }}>
            <CheckCircle className="w-2.5 h-2.5" style={{ color: '#00E676' }} />
            <span className="text-[9px] font-bold tabular-nums" style={{ color: '#00E676', fontFamily: 'var(--font-exo2), sans-serif' }}>{team.missionsCompleted}</span>
          </div>
          {team.missionsInReview > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.25)' }}>
              <Clock className="w-2.5 h-2.5" style={{ color: '#FF9800' }} />
              <span className="text-[9px] font-bold tabular-nums" style={{ color: '#FF9800', fontFamily: 'var(--font-exo2), sans-serif' }}>{team.missionsInReview}</span>
            </div>
          )}
          <button onClick={() => setOpen(o => !o)}
            className="ml-auto flex items-center gap-1 text-[10px] font-semibold"
            style={{ color: open ? '#00f0ff' : 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-exo2), sans-serif' }}>
            <Users className="w-3 h-3" /> {team.members.length}
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="px-3 pb-3 flex flex-wrap gap-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="w-full text-[8px] uppercase tracking-widest font-bold pt-2.5 mb-0.5"
            style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.25)' }}>Integrantes</p>
          {team.members.map(name => (
            <div key={name} className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ background: `${team.color}18`, border: `1px solid ${team.color}28` }}>
              <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black text-white"
                style={{ background: `${team.color}aa` }}>{name.charAt(0)}</div>
              <span className="text-[10px] font-semibold text-white/80" style={{ fontFamily: 'var(--font-exo2), sans-serif' }}>{name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── SchoolDetailContent ────────────────────────────────────── */

function SchoolDetailContent({ school, onClose, showClose }: { school: School; onClose: () => void; showClose?: boolean }) {
  const totalPoints = school.teams.reduce((s, t) => s + t.points, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Detail header */}
      <div className="px-5 py-4 flex items-center gap-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(0,240,255,0.12)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.2)' }}>
          <Building2 className="w-4 h-4" style={{ color: '#00f0ff' }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white leading-tight truncate" style={{ fontFamily: 'var(--font-cinzel), serif' }}>{school.name}</p>
          <p className="text-[10px]" style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.4)' }}>
            {school.director} · #{school.rankingPosition} ranking
          </p>
        </div>
        {showClose && (
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Scrollable detail body */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Posición', value: `#${school.rankingPosition}`, color: POSITION_COLOR(school.rankingPosition), icon: <Trophy className="w-3.5 h-3.5" /> },
            { label: 'Equipos',  value: school.teams.length,          color: '#00f0ff', icon: <Users className="w-3.5 h-3.5" /> },
            { label: 'Misiones', value: school.missionsCompleted,     color: '#00E676', icon: <CheckCircle className="w-3.5 h-3.5" /> },
            { label: 'Puntos',   value: totalPoints >= 1000 ? `${(totalPoints / 1000).toFixed(1)}k` : totalPoints,
              color: '#f9bd22', icon: <span className="text-sm" style={{ lineHeight: 1 }}>⚡</span> },
          ].map(s => (
            <div key={s.label} className="glass-panel hud-scanline rounded-2xl p-2.5 text-center"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
              <p className="text-base font-black text-white" style={{ fontFamily: 'var(--font-exo2), sans-serif' }}>{s.value}</p>
              <p className="text-[8px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-exo2), sans-serif' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Director */}
        <div className="glass-panel hud-scanline rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <Building2 className="w-4 h-4" style={{ color: '#10b981' }} />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: '#10b981', fontFamily: 'var(--font-exo2), sans-serif' }}>Director/a</p>
            <p className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-cinzel), serif' }}>{school.director}</p>
          </div>
        </div>

        {/* Teams */}
        <div>
          <p className="text-[9px] uppercase tracking-widest font-bold mb-3"
            style={{ fontFamily: 'var(--font-exo2), sans-serif', color: '#00f0ff' }}>
            Equipos ({school.teams.length})
          </p>
          <div className="flex flex-col gap-2">
            {school.teams.map(team => <TeamDetail key={team.id} team={team} />)}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────── */

export default function AdminPanelPage() {
  const router = useRouter()
  const { user, isHydrated, hydrate, logout } = useAuthStore()
  const [confirmLogout,  setConfirmLogout]  = useState(false)
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)

  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => {
    if (isHydrated && (!user || user.role !== 'admin')) router.replace('/login')
  }, [user, isHydrated, router])

  if (!user) return null

  const { eventStats, ranking, schools } = schoolsData
  const completedPercent = Math.round((eventStats.totalMissionsCompleted / (eventStats.totalTeams * 24)) * 100)

  return (
    <div className="min-h-screen" style={{ background: '#0d1117', fontFamily: 'var(--font-exo2), sans-serif' }}>

      {/* ── Header ── */}
      <div className="glass-panel hud-scanline px-6 py-4 flex items-center justify-between"
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
      <div className="p-5 max-w-screen-2xl mx-auto flex flex-col gap-5">

        {/* Event status + stats — always full width */}
        <div className="flex flex-col gap-3">
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
              <div className="h-full rounded-full" style={{ width: `${completedPercent}%`, background: 'linear-gradient(90deg,#00a8ff,#00f0ff)' }} />
            </div>
            <p className="text-xs mt-1.5 text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {completedPercent}% completado · {eventStats.totalMissionsCompleted} misiones completadas
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: <School    className="w-5 h-5" />, label: 'Colegios',  count: eventStats.totalSchools,           color: '#00f0ff' },
              { icon: <Users     className="w-5 h-5" />, label: 'Equipos',   count: eventStats.totalTeams,             color: '#a855f7' },
              { icon: <Flag      className="w-5 h-5" />, label: 'Misiones',  count: eventStats.totalMissionsCompleted, color: '#f9bd22' },
              { icon: <BarChart2 className="w-5 h-5" />, label: 'Capítulos', count: 5,                                 color: '#10b981' },
            ].map(a => (
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
        </div>

        {/* Two-column on lg: schools list + detail */}
        <div className="grid lg:grid-cols-[360px_1fr] xl:grid-cols-[420px_1fr] gap-5 items-start">

          {/* Left: schools list */}
          <div>
            <p className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: '#00f0ff' }}>
              Colegios participantes
            </p>
            <div className="flex flex-col gap-2">
              {ranking.map(r => {
                const school = schools.find(s => s.name === r.name)
                const isSelected = selectedSchool?.name === r.name
                return (
                  <button
                    key={r.position}
                    onClick={() => school && setSelectedSchool(isSelected ? null : school)}
                    className="glass-panel hud-scanline rounded-2xl px-4 py-3 flex items-center gap-3 w-full text-left transition-all active:scale-[0.99]"
                    style={{
                      border: isSelected
                        ? '1px solid rgba(0,240,255,0.4)'
                        : r.position <= 3 ? `1px solid ${POSITION_COLOR(r.position)}25` : '1px solid rgba(255,255,255,0.07)',
                      background: isSelected ? 'rgba(0,240,255,0.06)' : undefined,
                    }}
                  >
                    <span className="text-base font-black w-8 text-center shrink-0"
                      style={{ color: POSITION_COLOR(r.position), fontFamily: 'var(--font-exo2), sans-serif' }}>
                      #{r.position}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{r.name}</p>
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {school?.director ?? '—'} · {r.teams} equipo{r.teams !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end shrink-0 gap-0.5">
                      <span className="font-black text-sm tabular-nums"
                        style={{ fontFamily: 'var(--font-exo2), sans-serif', color: '#f9bd22' }}>
                        {r.points.toLocaleString('es-PE')}
                      </span>
                      <span className="text-[9px]" style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.3)' }}>XP</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right: school detail — shown on desktop, or mobile modal */}
          {/* Desktop panel */}
          <div className="hidden lg:block lg:sticky lg:top-5">
            {selectedSchool ? (
              <div className="glass-panel hud-scanline rounded-3xl overflow-hidden"
                style={{ border: '1px solid rgba(0,240,255,0.15)', maxHeight: 'calc(100vh - 120px)' }}>
                <SchoolDetailContent school={selectedSchool} onClose={() => setSelectedSchool(null)} showClose />
              </div>
            ) : (
              <div className="glass-panel hud-scanline rounded-3xl flex flex-col items-center justify-center py-16 gap-3"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                <School className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.15)' }} />
                <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-cinzel), serif' }}>
                  Selecciona un colegio
                </p>
                <p className="text-xs text-center max-w-52" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-exo2), sans-serif' }}>
                  Haz clic en cualquier colegio de la lista para ver su información completa
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: full-screen modal */}
      {selectedSchool && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col" style={{ background: '#0d1117' }}>
          <SchoolDetailContent school={selectedSchool} onClose={() => setSelectedSchool(null)} showClose />
        </div>
      )}

      <LogoutModal
        isOpen={confirmLogout}
        onConfirm={() => { logout(); router.replace('/login') }}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  )
}
