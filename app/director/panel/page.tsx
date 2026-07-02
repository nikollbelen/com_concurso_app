'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, Trophy, LogOut, Map, Users, CheckCircle,
  Clock, ChevronDown, ChevronUp, GraduationCap,
} from 'lucide-react'
import { useAuthStore } from '@/modules/auth/infrastructure/stores/authStore'
import { LogoutModal } from '@/shared/ui/components/LogoutModal'

import { useSchoolsDetail } from '@/modules/schools/presentation/hooks/useSchoolRanking'
import type { SchoolTeamDetail } from '@/modules/schools/infrastructure/repositories/schools.repository'

/* ── TeamCard ──────────────────────────────────────────────── */

function TeamCard({ team }: { team: SchoolTeamDetail }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="glass-panel hud-scanline rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${team.color}30` }}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base text-white shrink-0"
              style={{ background: `linear-gradient(135deg, ${team.color}dd, ${team.color})`, boxShadow: `0 3px 10px ${team.color}44`, fontFamily: 'var(--font-exo2), sans-serif' }}>
              {team.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-tight truncate" style={{ fontFamily: 'var(--font-cinzel), serif' }}>{team.name}</p>
              <p className="text-[10px] mt-0.5 truncate" style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.4)' }}>{team.levelTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl"
              style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.15)' }}>
              <span className="text-[10px] font-black text-white/50 uppercase tracking-wider" style={{ fontFamily: 'var(--font-exo2), sans-serif' }}>NV</span>
              <span className="text-sm font-black" style={{ fontFamily: 'var(--font-exo2), sans-serif', color: '#00f0ff' }}>{team.level}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl"
              style={{ background: 'rgba(249,189,34,0.08)', border: '1px solid rgba(249,189,34,0.2)' }}>
              <span className="text-sm font-black tabular-nums" style={{ fontFamily: 'var(--font-exo2), sans-serif', color: '#f9bd22' }}>{team.points.toLocaleString('es-PE')}</span>
              <span className="text-[9px] font-bold text-white/40" style={{ fontFamily: 'var(--font-exo2), sans-serif' }}>XP</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <GraduationCap className="w-3.5 h-3.5 shrink-0" style={{ color: '#00f0ff' }} />
          <span className="text-xs font-semibold text-white/70 truncate" style={{ fontFamily: 'var(--font-exo2), sans-serif' }}>{team.leader}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.25)' }}>
            <CheckCircle className="w-3 h-3" style={{ color: '#00E676' }} />
            <span className="text-[11px] font-bold tabular-nums" style={{ fontFamily: 'var(--font-exo2), sans-serif', color: '#00E676' }}>{team.missionsCompleted} completadas</span>
          </div>
          {team.missionsInReview > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.3)' }}>
              <Clock className="w-3 h-3" style={{ color: '#FF9800' }} />
              <span className="text-[11px] font-bold tabular-nums" style={{ fontFamily: 'var(--font-exo2), sans-serif', color: '#FF9800' }}>{team.missionsInReview} en revisión</span>
            </div>
          )}
          <button onClick={() => setOpen(o => !o)}
            className="ml-auto flex items-center gap-1 text-[11px] font-semibold transition-colors"
            style={{ fontFamily: 'var(--font-exo2), sans-serif', color: open ? '#00f0ff' : 'rgba(255,255,255,0.35)' }}>
            <Users className="w-3 h-3" />{team.members.length}
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 flex flex-wrap gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="w-full text-[9px] uppercase tracking-widest font-bold pt-3 mb-1"
            style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.3)' }}>Integrantes</p>
          {team.members.map(member => (
            <div key={member.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: `${team.color}14`, border: `1px solid ${team.color}30` }}>
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                style={{ background: `${team.color}cc` }}>{member.name.charAt(0)}</div>
              <span className="text-[11px] font-semibold text-white" style={{ fontFamily: 'var(--font-exo2), sans-serif' }}>{member.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────── */

export default function DirectorPanelPage() {
  const router = useRouter()
  const { user, isHydrated, hydrate, logout } = useAuthStore()
  const { data: schools = [] } = useSchoolsDetail()
  const [confirmLogout, setConfirmLogout] = useState(false)

  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => {
    if (isHydrated && (!user || user.role !== 'director')) router.replace('/login')
  }, [user, isHydrated, router])

  if (!isHydrated || !user) return null

  const mySchool    = schools.find(s => s.id === user.schoolId) ?? null
  const schoolTeams = mySchool?.teams ?? []
  const totalPoints = mySchool?.totalPoints ?? 0
  const rankingPos: number | string = mySchool?.rankingPosition ?? '—'
  const totalTeams  = mySchool?.teams.length ?? 0

  return (
    <div className="min-h-screen" style={{ background: '#0d1117', fontFamily: 'var(--font-exo2), sans-serif' }}>

      {/* ── Header ── */}
      <div className="glass-panel hud-scanline px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(0,240,255,0.15)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 0 12px rgba(16,185,129,0.4)' }}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: '#10b981' }}>Panel Director</p>
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
      <div className="p-5 max-w-7xl mx-auto flex flex-col gap-5">

        {/* School name + stats — always full width */}
        <div>
          {user.schoolName && (
            <p className="text-xs font-bold uppercase tracking-widest text-center mb-4"
              style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-cinzel), serif' }}>
              {user.schoolName}
            </p>
          )}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Posición', value: `#${rankingPos}`, color: '#f9bd22', icon: <Trophy className="w-4 h-4" /> },
              { label: 'Equipos',  value: totalTeams,       color: '#00f0ff', icon: <Users  className="w-4 h-4" /> },
              { label: 'Puntos',   value: totalPoints >= 1000 ? `${(totalPoints / 1000).toFixed(1)}k` : totalPoints,
                color: '#10b981', icon: <span className="text-sm" style={{ lineHeight: 1 }}>⚡</span> },
            ].map(s => (
              <div key={s.label} className="glass-panel hud-scanline rounded-2xl p-3 text-center"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
                <p className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-exo2), sans-serif' }}>{s.value}</p>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Teams — grid full width */}
        <div>
          <p className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: '#00f0ff' }}>
            Equipos del colegio
          </p>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {schoolTeams.map(team => <TeamCard key={team.id} team={team} />)}
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
