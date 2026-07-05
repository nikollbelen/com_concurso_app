'use client'

import { useState } from 'react'
import { Settings, Save, Loader2, Check, MapPin, Minus, Plus } from 'lucide-react'
import { useArrivalRadius, useSetArrivalRadius } from '../hooks/useArrivalRadius'

const MIN_RADIUS = 5
const MAX_RADIUS = 200

export function GameSettingsCard() {
  const { data: radius, isLoading } = useArrivalRadius()
  const save = useSetArrivalRadius()

  const [value, setValue] = useState('')

  /* sincroniza el input cuando la BD entrega/actualiza el valor (reset en render) */
  const [prevRadius, setPrevRadius] = useState<number | undefined>(undefined)
  if (radius !== undefined && radius !== prevRadius) {
    setPrevRadius(radius)
    setValue(String(radius))
  }

  const parsed = Number(value)
  const valid = Number.isFinite(parsed) && parsed >= MIN_RADIUS && parsed <= MAX_RADIUS
  const dirty = valid && parsed !== radius

  const clamp = (n: number) => Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, n))
  const step = (delta: number) => setValue(String(clamp((Number.isFinite(parsed) ? parsed : radius ?? 20) + delta)))

  const handleSave = () => {
    if (!dirty) return
    save.mutate(Math.round(parsed))
  }

  return (
    <div
      className="glass-panel hud-scanline rounded-2xl p-4"
      style={{ border: '1px solid rgba(245,158,11,0.25)', boxShadow: 'inset 0 0 20px rgba(245,158,11,0.04)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}
        >
          <Settings className="w-4 h-4" style={{ color: '#f59e0b' }} />
        </div>
        <p className="text-xs uppercase tracking-widest font-bold" style={{ color: '#f59e0b' }}>
          Configuración del juego
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" style={{ color: '#00f0ff' }} />
          <p className="text-sm font-bold text-white">Radio de llegada a la misión</p>
        </div>
        <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Distancia máxima (en metros) a la que el alumno puede estar del marcador para que el
          sistema lo deje comenzar la misión. El GPS del celular suele tener un error de 10–50 m.
        </p>

        <div className="flex items-center gap-2 mt-2">
          {/* Stepper − */}
          <button
            onClick={() => step(-5)}
            disabled={isLoading || !Number.isFinite(parsed) || parsed <= MIN_RADIUS}
            aria-label="Reducir 5 metros"
            className="w-10 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}
          >
            <Minus className="w-4 h-4" />
          </button>

          {/* Input */}
          <div className="relative flex-1">
            <input
              type="number"
              inputMode="numeric"
              min={MIN_RADIUS}
              max={MAX_RADIUS}
              value={value}
              disabled={isLoading}
              onChange={e => setValue(e.target.value)}
              className="w-full h-11 rounded-xl px-3 pr-10 text-center text-lg font-black tabular-nums text-white outline-none transition-colors"
              style={{
                fontFamily: 'var(--font-exo2), sans-serif',
                background: 'rgba(0,0,0,0.25)',
                border: `1px solid ${valid ? 'rgba(0,240,255,0.3)' : 'rgba(244,67,54,0.5)'}`,
              }}
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none"
              style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-exo2), sans-serif' }}
            >
              m
            </span>
          </div>

          {/* Stepper + */}
          <button
            onClick={() => step(5)}
            disabled={isLoading || !Number.isFinite(parsed) || parsed >= MAX_RADIUS}
            aria-label="Aumentar 5 metros"
            className="w-10 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Guardar */}
          <button
            onClick={handleSave}
            disabled={!dirty || save.isPending}
            className="h-11 px-4 rounded-xl flex items-center justify-center gap-1.5 shrink-0 font-bold text-xs uppercase tracking-wider text-white transition-all active:scale-95 disabled:opacity-40"
            style={{
              fontFamily: 'var(--font-exo2), sans-serif',
              background: 'linear-gradient(to bottom, #f59e0b, #d97706)',
              border: '1px solid rgba(255,255,255,0.25)',
              boxShadow: '0 4px 0 rgba(0,0,0,0.2)',
            }}
          >
            {save.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : save.isSuccess && !dirty
                ? <><Check className="w-4 h-4" /> Guardado</>
                : <><Save className="w-4 h-4" /> Guardar</>}
          </button>
        </div>

        {!valid && (
          <p className="text-[11px] font-semibold mt-1" style={{ color: '#f87171' }}>
            Ingresa un valor entre {MIN_RADIUS} y {MAX_RADIUS} metros.
          </p>
        )}
        {save.isError && (
          <p className="text-[11px] font-semibold mt-1" style={{ color: '#f87171' }}>
            No se pudo guardar. Verifica tu conexión e inténtalo de nuevo.
          </p>
        )}
      </div>
    </div>
  )
}
