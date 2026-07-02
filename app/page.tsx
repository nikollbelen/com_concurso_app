'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { LogIn, Trophy, Users, School, Target, Map as MapIcon, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/modules/auth/infrastructure/stores/authStore'
import { useChapters } from '@/modules/chapters/presentation/hooks/useChapters'
import { useSchoolRanking } from '@/modules/schools/presentation/hooks/useSchoolRanking'

const STEPS = [
  { icon: Users,   title: 'Tu colegio arma tu equipo', desc: 'El docente forma tu escuadra y te da tu acceso.' },
  { icon: MapIcon, title: 'Explora Arequipa',           desc: 'Ve a los lugares históricos marcados en el mapa.' },
  { icon: Target,  title: 'Completa misiones',          desc: 'Gana XP, colecciona fragmentos y sube en el ranking.' },
]

export default function HomePage() {
  const router = useRouter()
  const { user, isHydrated, hydrate } = useAuthStore()
  const { data: ranking = [] } = useSchoolRanking()
  const { data: chapters = [] } = useChapters()

  useEffect(() => { void hydrate() }, [hydrate])

  const isLogged = isHydrated && !!user

  const schoolsCount = ranking.length || 16
  const teamsCount = ranking.reduce((a, s) => a + s.totalTeams, 0)
  const missionsCompleted = ranking.reduce((a, s) => a + s.missionsCompleted, 0)

  const stats = [
    { icon: School, label: 'Colegios', value: schoolsCount, color: '#00f0ff' },
    { icon: Users,  label: 'Equipos',  value: teamsCount,   color: '#a855f7' },
    { icon: Trophy, label: 'Misiones', value: missionsCompleted, color: '#f9bd22' },
  ]

  const fragments = chapters.map(c => c.fragment).filter(f => f.icon)

  return (
    <div className="min-h-dvh w-full flex flex-col items-center justify-center relative overflow-x-hidden"
      style={{ background: '#0d1117' }}>

      {/* Ambient glows + hadas de fondo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full" style={{ width: 600, height: 600, top: '-25%', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgba(0,168,255,0.10) 0%, transparent 70%)' }} />
        <div className="absolute rounded-full" style={{ width: 420, height: 420, bottom: '-10%', right: '-12%', background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)' }} />
        <span className="fairy fairy-1" aria-hidden />
        <span className="fairy fairy-2" aria-hidden />
      </div>

      <div className="relative z-10 w-full max-w-md lg:max-w-5xl px-6 py-12 lg:py-16 flex flex-col gap-10">

        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-2 lg:gap-14 lg:items-center">

          {/* ── Hero (logo + bienvenida + stats + CTAs) ── */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
            <div style={{ filter: 'drop-shadow(0 0 32px rgba(0,168,255,0.45)) drop-shadow(0 8px 24px rgba(0,0,0,0.5))' }}>
              <Image src="/images/logo_principal.png" alt="La Búsqueda de los Guardianes de Arequipa"
                width={170} height={170} priority loading="eager" className="object-contain" style={{ width: 170, height: 'auto' }} />
            </div>

            <div className="flex flex-col items-center lg:items-start gap-3">
              <p className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{ fontFamily: 'var(--font-exo2), sans-serif', color: '#00f0ff' }}>
                Concurso inter-escolar
              </p>
              <h1 className="text-lg lg:text-2xl font-black leading-tight text-white" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
                Arequipa necesita a sus Guardianes.
                <span style={{ color: '#f9bd22' }}> ¿Aceptas la búsqueda?</span>
              </h1>
              <p className="text-sm lg:text-base max-w-md" style={{ fontFamily: 'var(--font-inter), sans-serif', color: 'rgba(255,255,255,0.45)' }}>
                Recorre la Ciudad Blanca con tu equipo, resuelve misiones en lugares reales y lleva a tu colegio a lo más alto.
              </p>
            </div>

            {/* Stats en vivo */}
            <div className="grid grid-cols-3 gap-2.5 w-full max-w-sm lg:max-w-none">
              {stats.map(s => (
                <div key={s.label} className="glass-panel hud-scanline rounded-2xl py-3 flex flex-col items-center gap-1"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                  <span className="text-xl font-black text-white tabular-nums" style={{ fontFamily: 'var(--font-exo2), sans-serif' }}>{s.value}</span>
                  <span className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="w-full max-w-sm lg:max-w-none flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push(isLogged ? '/mapa' : '/login')}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest text-white transition-all active:scale-[0.98] active:translate-y-0.5"
                style={{
                  fontFamily: 'var(--font-exo2), sans-serif',
                  background: 'linear-gradient(to bottom, #00d2ff, #00a8ff)',
                  boxShadow: '0 6px 0 rgba(0,0,0,0.25), inset 0 -3px 0 rgba(0,0,0,0.15), inset 0 3px 0 rgba(255,255,255,0.25), 0 0 20px rgba(0,168,255,0.4)',
                  border: '1.5px solid rgba(255,255,255,0.25)',
                }}>
                {isLogged ? <><ArrowRight className="w-4 h-4" /> Continuar</> : <><LogIn className="w-4 h-4" /> Iniciar sesión</>}
              </button>

              <button
                onClick={() => router.push('/tablero-vivo')}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all active:scale-[0.98] active:translate-y-0.5"
                style={{
                  fontFamily: 'var(--font-exo2), sans-serif',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1.5px solid rgba(249,189,34,0.35)',
                  color: '#f9bd22',
                }}>
                <Trophy className="w-4 h-4" /> Tablero en vivo
              </button>
            </div>
          </div>

          {/* ── Info (cómo funciona + fragmentos) ── */}
          <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-col gap-3">
              <p className="text-[10px] uppercase tracking-widest font-bold text-center lg:text-left" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-exo2), sans-serif' }}>
                Cómo funciona
              </p>
              {STEPS.map((step, i) => (
                <div key={step.title} className="glass-panel rounded-2xl px-4 py-3 flex items-center gap-3"
                  style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 relative"
                    style={{ background: 'rgba(0,168,255,0.1)', border: '1px solid rgba(0,168,255,0.25)' }}>
                    <step.icon className="w-4 h-4" style={{ color: '#00a8ff' }} />
                    <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                      style={{ background: '#00a8ff' }}>{i + 1}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{step.title}</p>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {fragments.length > 0 && (
              <div className="glass-panel rounded-2xl px-4 py-4 flex flex-col items-center gap-3"
                style={{ border: '1px solid rgba(249,189,34,0.2)' }}>
                <p className="text-[10px] uppercase tracking-widest font-bold text-center" style={{ color: '#f9bd22', fontFamily: 'var(--font-exo2), sans-serif' }}>
                  Colecciona los 5 Fragmentos
                </p>
                <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
                  {fragments.map(f => (
                    <div key={f.id} className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Image src={f.icon} alt={f.name} width={56} height={56} className="object-contain opacity-90" style={{ width: '78%', height: '78%' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Patrocinadores ── */}
        <div className="flex flex-col items-center gap-2">
          <span className="uppercase tracking-widest opacity-40" style={{ fontFamily: 'var(--font-exo2), sans-serif', fontSize: 9, letterSpacing: '0.12em', color: 'var(--color-on-surface-var)' }}>
            Powered by
          </span>
          <div className="flex items-center gap-3">
            <Image src="/images/patrocinadores/logo_yuki.png" alt="Yuki" width={40} height={32} className="object-contain opacity-70" style={{ width: 'auto', height: 26 }} />
            <Image src="/images/patrocinadores/citrus.png" alt="Citrus" width={40} height={32} className="object-contain opacity-70" style={{ width: 'auto', height: 26 }} />
          </div>
        </div>
      </div>

      {/* Hadas de fondo — solo transform/opacity (GPU), muy liviano */}
      <style>{`
        .fairy {
          position: absolute; top: 0; left: 0; border-radius: 9999px;
          will-change: transform, opacity;
        }
        .fairy-1 {
          width: 16px; height: 16px;
          background: radial-gradient(circle, #ffffff 0%, #8fe8ff 48%, rgba(0,168,255,0) 72%);
          box-shadow: 0 0 20px 7px rgba(80,210,255,0.75), 0 0 42px 16px rgba(0,168,255,0.42);
          animation: fairy-path-1 16s ease-in-out infinite, fairy-twinkle 2.6s ease-in-out infinite;
        }
        .fairy-2 {
          width: 12px; height: 12px;
          background: radial-gradient(circle, #fff6d6 0%, #f9bd22 48%, rgba(249,189,34,0) 72%);
          box-shadow: 0 0 17px 6px rgba(249,189,34,0.7), 0 0 36px 14px rgba(249,189,34,0.35);
          animation: fairy-path-2 20s ease-in-out infinite, fairy-twinkle 2s ease-in-out infinite;
          animation-delay: -6s, 0s;
        }
        @keyframes fairy-path-1 {
          0%   { transform: translate(8vw, 72vh); }
          20%  { transform: translate(26vw, 24vh); }
          45%  { transform: translate(58vw, 58vh); }
          68%  { transform: translate(82vw, 18vh); }
          100% { transform: translate(8vw, 72vh); }
        }
        @keyframes fairy-path-2 {
          0%   { transform: translate(88vw, 30vh); }
          25%  { transform: translate(62vw, 68vh); }
          55%  { transform: translate(30vw, 40vh); }
          80%  { transform: translate(12vw, 78vh); }
          100% { transform: translate(88vw, 30vh); }
        }
        @keyframes fairy-twinkle {
          0%, 100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fairy { animation: none; opacity: 0.55; }
        }
      `}</style>
    </div>
  )
}
