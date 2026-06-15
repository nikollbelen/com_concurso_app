'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { useAuthStore } from '@/modules/auth/infrastructure/stores/authStore'

export default function LoginPage() {
  const router = useRouter()
  const { login, user, hydrate } = useAuthStore()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => {
    if (user) router.replace('/mapa')
  }, [user, router])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setTimeout(() => {
      const result = login(username, password)
      if (result === 'invalid') {
        setError('Usuario o contraseña incorrectos')
        setLoading(false)
      }
    }, 500)
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: '#0d1117' }}
    >
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full" style={{ width: 600, height: 600, top: '-20%', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgba(0,168,255,0.08) 0%, transparent 70%)' }} />
        <div className="absolute rounded-full" style={{ width: 400, height: 400, bottom: '-10%', right: '-10%', background: 'radial-gradient(circle, rgba(0,240,255,0.05) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm px-6 flex flex-col items-center gap-8">

        {/* Logo */}
        <div className="text-center flex flex-col items-center">
          <div
            className="relative mb-4"
            style={{
              filter: 'drop-shadow(0 0 32px rgba(0,168,255,0.45)) drop-shadow(0 8px 24px rgba(0,0,0,0.5))',
            }}
          >
            <Image
              src="/images/logo_principal.png"
              alt="La Búsqueda de los Guardianes de Arequipa"
              width={180}
              height={180}
              priority
              loading="eager"
              className="object-contain"
              style={{ width: 180, height: 'auto' }}
            />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">

          {/* Username */}
          <div className="glass-panel flex items-center gap-3 px-4 rounded-2xl"
            style={{ border: '1px solid rgba(0,240,255,0.2)', background: 'rgba(0,168,255,0.08)' }}>
            <input
              type="text"
              placeholder="Usuario (ej: nbonilla)"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              spellCheck={false}
              className="flex-1 bg-transparent py-4 text-sm text-white placeholder:text-white/30 outline-none"
              style={{ fontFamily: 'var(--font-exo2), sans-serif' }}
            />
          </div>

          {/* Password */}
          <div className="glass-panel flex items-center gap-3 px-4 rounded-2xl"
            style={{ border: '1px solid rgba(0,240,255,0.2)', background: 'rgba(0,168,255,0.08)' }}>
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              className="flex-1 bg-transparent py-4 text-sm text-white placeholder:text-white/30 outline-none"
              style={{ fontFamily: 'var(--font-exo2), sans-serif' }}
            />
            <button type="button" onClick={() => setShowPwd(v => !v)} className="shrink-0"
              style={{ color: 'rgba(255,255,255,0.35)' }}>
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
              style={{ background: 'rgba(255,59,48,0.12)', border: '1px solid rgba(255,59,48,0.3)', color: '#ff6b6b', fontFamily: 'var(--font-exo2), sans-serif' }}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !username || !password}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest text-white transition-all active:scale-[0.98] active:translate-y-0.5 disabled:opacity-50"
            style={{
              fontFamily: 'var(--font-exo2), sans-serif',
              background: 'linear-gradient(to bottom, #00d2ff, #00a8ff)',
              boxShadow: loading ? 'none' : '0 6px 0 rgba(0,0,0,0.25), inset 0 -3px 0 rgba(0,0,0,0.15), inset 0 3px 0 rgba(255,255,255,0.25), 0 0 20px rgba(0,168,255,0.4)',
              border: '1.5px solid rgba(255,255,255,0.25)',
            }}
          >
            {loading
              ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white" style={{ animation: 'spin 0.8s linear infinite' }} />
              : <><LogIn className="w-4 h-4" /> Entrar</>
            }
          </button>
        </form>
      </div>

      {/* Autofill override + spin */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px rgba(5,15,35,0.95) inset !important;
          -webkit-text-fill-color: #fff !important;
          caret-color: #fff;
          transition: background-color 9999s ease;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
