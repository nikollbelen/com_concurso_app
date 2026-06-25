'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, CheckCircle, Clock, Lock, LogOut, ChevronLeft, Award, Trophy, Map as MapIcon, Shield, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/modules/auth/infrastructure/stores/authStore'
import { LogoutModal } from '@/shared/ui/components/LogoutModal'
import { supabase } from '@/shared/infrastructure/supabase/client'

// Interfaces basadas en tu base de datos
interface ChapterData {
  id: string
  number: number
  title: string
  color: string
  total_missions: number
  required_level: number
  fragments: { id: string; name: string; icon: string } | null
}

interface TeamDashboardData {
  team_id: number
  level: number
  points: number
  levelTitle: string
  earnedFragments: string[]
}

export default function StudentPanelPage() {
  const router = useRouter()
  const { user, isHydrated, hydrate, logout } = useAuthStore() as any
  const [confirmLogout, setConfirmLogout] = useState(false)

  // Estados de datos vivos
  const [loading, setLoading] = useState(true)
  const [noTeam, setNoTeam] = useState(false)
  const [dashboard, setDashboard] = useState<TeamDashboardData | null>(null)
  const [chapters, setChapters] = useState<ChapterData[]>([])
  
  // Estadísticas calculadas en vivo
  const [totalCompleted, setTotalCompleted] = useState(0)
  const [totalReview, setTotalReview] = useState(0)
  const [totalSchools, setTotalSchools] = useState(16)
  const [chapterStats, setChapterStats] = useState<any[]>([])

  useEffect(() => { hydrate() }, [hydrate])
  
  useEffect(() => {
    if (isHydrated && (!user || user.role !== 'student')) router.replace('/login')
  }, [user, isHydrated, router])

  // Lógica de carga en vivo (Bypass de Caché)
  useEffect(() => {
  const fetchDashboardLive = async () => {
    // 1. Obtenemos el equipo de forma segura basándonos en la sesión del usuario
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // 2. Consulta directa a la tabla usuarios para obtener el team_id real
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('team_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !userData?.team_id) {
      setNoTeam(true);
      setLoading(false);
      return;
    }

    const teamId = userData.team_id; // ¡Aquí capturamos el 1 que ves en tu log!

    try {
    // 3. Ahora sí, hacemos las consultas usando este teamId confirmado
    const [teamRes, chaptersRes, progressRes, schoolsCountRes] = await Promise.all([
      supabase.from('vista_equipos_completos').select('*').eq('team_id', teamId).maybeSingle(),
      supabase.from('chapters').select('id, number, title, color, total_missions, required_level, fragments:id_fragment(id, name, icon)').order('number', { ascending: true }),
      supabase.from('mission_progression').select('status, missions:mission_id(id_chapter)').eq('team_id', teamId),
      supabase.from('schools').select('id', { count: 'exact', head: true })
    ]);

        if (schoolsCountRes.count !== null) {
          setTotalSchools(schoolsCountRes.count)
        }

        if (teamRes.data && chaptersRes.data) {
          const teamData = teamRes.data
          const chaptersData = chaptersRes.data as unknown as ChapterData[]
          const progressData = progressRes.data || []

          // Cálculos generales
          // Asumimos que los estados en tu BD son 'aprobada' (completed) y 'pendiente' (review)
          const completed = progressData.filter(p => p.status === 'aprobada' || p.status === 'completed')
          const review = progressData.filter(p => p.status === 'pendiente' || p.status === 'review')
          
          setTotalCompleted(completed.length)
          setTotalReview(review.length)

          // Armamos los stats por capítulo
          const stats = chaptersData.map(ch => {
            const chProgress = progressData.filter(p => (p.missions as any)?.id_chapter === ch.id)
            const chCompleted = chProgress.filter(p => p.status === 'aprobada' || p.status === 'completed').length
            const chReview = chProgress.filter(p => p.status === 'pendiente' || p.status === 'review').length
            
            // Un capítulo se bloquea si el nivel del equipo es menor al requerido
            const isLocked = teamData.level < (ch.required_level || 1)

            return {
              ...ch,
              total: ch.total_missions || 0,
              completed: chCompleted,
              review: chReview,
              locked: isLocked
            }
          })

          setDashboard({
            team_id: teamData.team_id,
            level: teamData.level || 1,
            points: teamData.points || 0,
            levelTitle: `Nivel ${teamData.level || 1}`, // Puedes cruzarlo con tu objeto LEVEL_TITLES si deseas
            earnedFragments: teamData.earned_fragments || []
          })
          setChapters(chaptersData)
          setChapterStats(stats)
        }
      } catch (err) {
        console.error("Error cargando panel:", err)
      } finally {
        setLoading(false)
      }
    }

    if (user && isHydrated) {
      fetchDashboardLive()
    }
  }, [user, isHydrated])

  if (!isHydrated || !user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1117' }}>
        <p className="text-sm font-bold animate-pulse text-cyan-400">Sincronizando datos en vivo...</p>
      </div>
    )
  }

  // Pantalla de protección si no tiene equipo asignado en vivo
  if (noTeam || !dashboard) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: '#0d1117', fontFamily: 'var(--font-exo2), sans-serif' }}>
        <div className="glass-panel p-8 rounded-3xl max-w-md border border-red-500/30">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-white uppercase tracking-wider mb-2">Sin Equipo Asignado</h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Contacta a tu profesor guía para que te asigne a un equipo. Cuando lo haga, recarga esta página y entrarás automáticamente.
          </p>
          <button onClick={() => setConfirmLogout(true)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold transition-all mx-auto">
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
        <LogoutModal isOpen={confirmLogout} onConfirm={() => { logout(); router.replace('/login') }} onCancel={() => setConfirmLogout(false)} />
      </div>
    )
  }

  // Cálculos matemáticos del diseño original
  const nextLevelPoints = dashboard.level * 1000 // Escala de 1000pts por nivel
  const xpPercent = Math.min(100, Math.round((dashboard.points / nextLevelPoints) * 100))
  const unlockedChaptersCount = chapterStats.filter(c => !c.locked).length

  return (
    <div className="min-h-screen" style={{ background: '#0d1117', fontFamily: 'var(--font-exo2), sans-serif' }}>

      {/* ── Header Original ─────────────────────────────────────────── */}
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

      {/* ── Layout Original: mobile stack / desktop two-column ──────── */}
      <div className="mx-auto px-4 pt-5 pb-10 max-w-7xl lg:flex lg:gap-8 lg:items-start lg:px-8">

        {/* ══ Columna izquierda: perfil + stats + navegación ══ */}
        <div className="lg:w-80 xl:w-96 shrink-0 flex flex-col gap-4 lg:sticky lg:top-24">

          {/* XP card */}
          <div className="glass-panel hud-scanline rounded-2xl p-5"
            style={{ border: '1px solid rgba(0,240,255,0.2)', boxShadow: 'inset 0 0 20px rgba(0,240,255,0.04)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest font-bold" style={{ color: '#00f0ff' }}>
                  {dashboard.levelTitle}
                </p>
                <p className="text-3xl font-black text-white mt-0.5" style={{ fontFamily: 'var(--font-exo2), sans-serif' }}>
                  {dashboard.points.toLocaleString('es-PE')} <span className="text-base font-bold" style={{ color: '#f9bd22' }}>XP</span>
                </p>
              </div>
              <div className="flex flex-col items-center px-3 py-2 rounded-2xl"
                style={{ background: 'linear-gradient(160deg,#00b4d8,#0077b6)', boxShadow: '0 4px 0 rgba(0,0,0,0.4), 0 0 16px rgba(0,240,255,0.3)' }}>
                <span className="text-[9px] uppercase tracking-widest text-white/60">NV</span>
                <span className="text-2xl font-black text-white leading-none">{dashboard.level}</span>
              </div>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full relative overflow-hidden"
                style={{ width: `${xpPercent}%`, background: 'linear-gradient(90deg,#00a8ff,#00f0ff)', boxShadow: '0 0 8px rgba(0,240,255,0.7)', transition: 'width 0.7s ease' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent" style={{ animation: 'shimmer 2.5s infinite' }} />
              </div>
            </div>
            <p className="text-[11px] text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {dashboard.points} / {nextLevelPoints} XP para nivel {dashboard.level + 1}
            </p>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <CheckCircle className="w-4 h-4" />, label: 'Completadas', value: totalCompleted, color: '#00e676' },
              { icon: <Clock className="w-4 h-4" />,       label: 'En revisión', value: totalReview,    color: '#ff9800' },
              { icon: <MapIcon className="w-4 h-4" />,     label: 'Capítulos',   value: unlockedChaptersCount, color: '#00f0ff' },
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
              className="glass-panel hud-scanline rounded-2xl p-4 flex items-center gap-3 text-left w-full cursor-pointer"
              style={{ border: '1px solid rgba(0,240,255,0.15)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.25)' }}>
                <Trophy className="w-4 h-4" style={{ color: '#00f0ff' }} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Ranking</p>
                <p className="text-[9px] uppercase tracking-wider tabular-nums" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {totalSchools} colegios
                </p>
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
                {dashboard.earnedFragments.length} / {chapters.length}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {chapters.map(ch => {
                const fragId = ch.fragments?.id || ''
                const earned = dashboard.earnedFragments.includes(fragId)
                return (
                  <div key={ch.id} className="flex flex-col items-center gap-1.5">
                    <div className="w-full aspect-square rounded-2xl flex items-center justify-center relative"
                      style={{
                        background: earned ? `${ch.color}22` : 'rgba(255,255,255,0.04)',
                        border: earned ? `1.5px solid ${ch.color}60` : '1.5px solid rgba(255,255,255,0.08)',
                        boxShadow: earned ? `0 0 12px ${ch.color}40` : 'none',
                      }}>
                      {ch.fragments?.icon && (
                        <img
                          src={ch.fragments.icon}
                          alt={ch.fragments.name}
                          style={{
                            width: '82%',
                            height: '82%',
                            objectFit: 'contain',
                            filter: earned ? 'none' : 'grayscale(100%) brightness(0.35)',
                            transition: 'filter 0.3s ease',
                          }}
                        />
                      )}
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
                    <p className="text-center leading-tight truncate w-full"
                      style={{ fontSize: 9, fontFamily: 'var(--font-exo2), sans-serif', color: earned ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }}>
                      {ch.fragments?.name ? ch.fragments.name.replace('Fragmento ', '') : 'Bloqueado'}
                    </p>
                  </div>
                )
              })}
            </div>
            {dashboard.earnedFragments.length < chapters.length && (
              <p className="text-[11px] mt-3 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Completa todas las misiones de un capítulo para obtener su fragmento
              </p>
            )}
            {dashboard.earnedFragments.length === chapters.length && dashboard.earnedFragments.length > 0 && (
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
                        <p className="text-sm font-bold text-white truncate w-32">{ch.title}</p>
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