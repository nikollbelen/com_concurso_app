'use client'

import { AlertTriangle } from 'lucide-react'

interface GpsBannerProps {
  onActivate: () => void
}

export function GpsBanner({ onActivate }: GpsBannerProps) {
  return (
    <div
      className="fixed left-5 right-5 z-50"
      style={{ top: 'calc(72px + 8px)' }}
    >
      <div
        className="glass-panel hud-scanline rounded-2xl"
        style={{
          border: '1px solid rgba(255,149,0,0.4)',
          boxShadow: '0 8px 24px rgba(255,149,0,0.2), inset 0 0 16px rgba(255,149,0,0.05)',
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: '#ff9500' }} />
          <p
            className="flex-1 text-sm font-semibold"
            style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.85)' }}
          >
            Activa tu ubicación para desbloquear las misiones
          </p>
          <button
            onClick={onActivate}
            className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider transition-all active:scale-95"
            style={{
              background: 'linear-gradient(to bottom, #ffd426, #ff9500)',
              color: '#0f172a',
              fontFamily: 'var(--font-exo2), sans-serif',
              fontWeight: 700,
              boxShadow: '0 3px 0 rgba(0,0,0,0.25)',
            }}
          >
            Activar GPS
          </button>
        </div>
      </div>
    </div>
  )
}
