'use client'

import { LogOut } from 'lucide-react'

interface LogoutModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function LogoutModal({ isOpen, onConfirm, onCancel }: LogoutModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-6"
      style={{ zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={onCancel}
    >
      <div
        className="glass-panel hud-scanline rounded-3xl p-6 w-full max-w-xs text-center"
        style={{ border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 24px 60px rgba(0,0,0,0.7)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.3)' }}>
          <LogOut className="w-6 h-6" style={{ color: '#ff6b6b' }} />
        </div>
        <p className="text-base font-black text-white mb-1" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
          ¿Cerrar sesión?
        </p>
        <p className="text-sm mb-6" style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.4)' }}>
          Tendrás que volver a iniciar sesión para acceder al juego.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl text-sm font-bold uppercase tracking-wider"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-exo2), sans-serif' }}>
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl text-sm font-bold uppercase tracking-wider text-white"
            style={{ background: 'linear-gradient(to bottom,#ff5252,#d32f2f)', boxShadow: '0 4px 0 rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', fontFamily: 'var(--font-exo2), sans-serif' }}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
