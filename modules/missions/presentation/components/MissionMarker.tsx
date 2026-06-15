'use client'

import { Marker } from 'react-map-gl/mapbox'
import { CheckCircle, Clock, Lock, Target, Camera, Palette } from 'lucide-react'

export type MissionStatus = 'available' | 'completed' | 'review' | 'locked'
export type MissionType   = 'trivia' | 'photo' | 'creative'

interface MissionMarkerProps {
  id: string
  longitude: number
  latitude: number
  status: MissionStatus
  type: MissionType
  onClick: (id: string) => void
}

const STATUS_CFG = {
  available: {
    gradient: 'linear-gradient(to bottom, #ff6b6b, #ff3b30)',
    tailColor: '#ff3b30',
    shadow: '0 10px 15px -3px rgba(255,59,48,0.5), 0 4px 6px -2px rgba(0,0,0,0.4)',
    glow: 'rgba(255,59,48,0.5)',
    bounce: true,
    border: '3px solid rgba(255,255,255,0.9)',
  },
  completed: {
    gradient: 'linear-gradient(to bottom, #4cd964, #34c759)',
    tailColor: '#34c759',
    shadow: '0 10px 15px -3px rgba(52,199,89,0.45), 0 4px 6px -2px rgba(0,0,0,0.4)',
    glow: 'rgba(52,199,89,0.4)',
    bounce: false,
    border: '3px solid rgba(255,255,255,0.9)',
  },
  review: {
    gradient: 'linear-gradient(to bottom, #ffd426, #ff9500)',
    tailColor: '#ff9500',
    shadow: '0 10px 15px -3px rgba(255,149,0,0.45), 0 4px 6px -2px rgba(0,0,0,0.4)',
    glow: 'rgba(255,149,0,0.45)',
    bounce: true,
    border: '3px solid rgba(255,255,255,0.9)',
  },
  locked: {
    gradient: 'linear-gradient(to bottom, #64748b, #475569)',
    tailColor: '#475569',
    shadow: '0 6px 12px rgba(0,0,0,0.4)',
    glow: 'none',
    bounce: false,
    border: '3px solid rgba(255,255,255,0.3)',
  },
} as const

function PinIcon({ status, type }: { status: MissionStatus; type: MissionType }) {
  const cls = 'w-5 h-5 text-white drop-shadow-sm'
  if (status === 'completed') return <CheckCircle className={cls} strokeWidth={2.5} />
  if (status === 'review')    return <Clock       className={cls} strokeWidth={2.5} />
  if (status === 'locked')    return <Lock        className="w-5 h-5 text-white/50" strokeWidth={2} />
  if (type === 'photo')       return <Camera      className={cls} strokeWidth={2.5} />
  if (type === 'creative')    return <Palette     className={cls} strokeWidth={2.5} />
  return <Target className={cls} strokeWidth={2.5} />
}

export function MissionMarker({ id, longitude, latitude, status, type, onClick }: MissionMarkerProps) {
  const cfg = STATUS_CFG[status]

  return (
    <Marker longitude={longitude} latitude={latitude} anchor="bottom">
      <div
        className="flex flex-col items-center cursor-pointer select-none group"
        onClick={() => onClick(id)}
        style={{
          /* The bottom of this element aligns to the coordinate */
          paddingBottom: 12, /* space for pin tail */
          animation: cfg.bounce ? 'game-bounce 2s ease-in-out infinite' : undefined,
        }}
      >
        {/* Circle pin */}
        <div
          className="relative w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-150 group-hover:scale-110 group-active:scale-95"
          style={{
            background: cfg.gradient,
            border: cfg.border,
            boxShadow: cfg.shadow,
          }}
        >
          {/* Highlight gloss */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.28) 0%, transparent 60%)',
              pointerEvents: 'none',
            }}
          />
          <PinIcon status={status} type={type} />
        </div>

        {/* Pin tail triangle */}
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft:  '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop:   `14px solid ${cfg.tailColor}`,
            marginTop: -2,
            filter: 'drop-shadow(0px 4px 2px rgba(0,0,0,0.4))',
          }}
        />
      </div>
    </Marker>
  )
}
