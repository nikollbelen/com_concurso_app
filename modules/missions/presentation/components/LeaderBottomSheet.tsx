'use client'

import { Clock, CheckCircle, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export interface PendingMission {
  id: string
  location: string
  type: 'trivia' | 'photo' | 'creative'
  points: number
}

interface LeaderBottomSheetProps {
  pendingMissions: PendingMission[]
  teamName: string
}

export function LeaderBottomSheet({ pendingMissions, teamName }: LeaderBottomSheetProps) {
  const router = useRouter()
  const count = pendingMissions.length

  return (
    <div
      className="fixed left-0 right-0 z-40 flex flex-col items-center px-5 pointer-events-none"
      style={{ bottom: 'max(20px, env(safe-area-inset-bottom))' }}
    >
      <div
        className="glass-panel hud-scanline w-full rounded-full pointer-events-auto"
        style={{
          maxWidth: 440,
          boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3">

          {count > 0
            ? <Clock className="w-5 h-5 shrink-0" style={{ color: '#FF9800' }} />
            : <CheckCircle className="w-5 h-5 shrink-0" style={{ color: '#00E676' }} />
          }

          <div className="flex-1 min-w-0">
            <p
              className="text-[9px] uppercase tracking-widest font-bold leading-none mb-0.5"
              style={{ fontFamily: 'var(--font-exo2), sans-serif', color: '#00f0ff' }}
            >
              {teamName}
            </p>
            <p
              className="text-[12px] font-bold leading-tight truncate text-white"
              style={{ fontFamily: 'var(--font-cinzel), serif' }}
            >
              {count > 0
                ? `${count} misión${count > 1 ? 'es' : ''} por revisar`
                : 'Todo al día · sin pendientes'
              }
            </p>
          </div>

          {count > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <div
                className="flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-black"
                style={{
                  background: 'rgba(255,152,0,0.2)',
                  border: '1px solid rgba(255,152,0,0.5)',
                  color: '#FF9800',
                  fontFamily: 'var(--font-exo2), sans-serif',
                }}
              >
                {count}
              </div>
              <button
                onClick={() => router.push('/leader/panel')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95"
                style={{
                  fontFamily: 'var(--font-exo2), sans-serif',
                  background: 'linear-gradient(to bottom, #FF9800, #e07b00)',
                  boxShadow: '0 3px 0 rgba(0,0,0,0.3), 0 0 12px rgba(255,152,0,0.3)',
                  color: 'white',
                  border: '1.5px solid rgba(255,255,255,0.2)',
                }}
              >
                Revisar
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
