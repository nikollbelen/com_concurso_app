'use client'

import { Camera, HelpCircle, Palette, Star, Clock, CheckCircle, Lock, MapPin, ArrowRight, X } from 'lucide-react'

function Tooltip({ text, align = 'center' }: { text: string; align?: 'left' | 'center' | 'right' }) {
  const h = align === 'left' ? 'left-0' : align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'
  return (
    <div
      className={`absolute bottom-full mb-2 ${h} whitespace-nowrap px-2.5 py-1.5 rounded-xl text-[11px] font-semibold pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50`}
      style={{
        background: 'rgba(15,23,42,0.92)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.85)',
        fontFamily: 'var(--font-exo2), sans-serif',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      {text}
    </div>
  )
}
import type { MissionStatus, MissionType } from './MissionMarker'

/* ── types ────────────────────────────────────────────────── */

export interface Chapter {
  id: string
  number: number
  title: string
  fragment: { name: string; icon: string }
  color: string
  totalMissions: number
}

export interface SelectedMission {
  id: string
  location: string
  type: MissionType
  points: number
  question: string
  status: MissionStatus
}

interface MissionBottomSheetProps {
  chapter: Chapter
  completedCount: number
  reviewCount: number
  selectedMission: SelectedMission | null
  hasFragment: boolean
  onGoToMission: (id: string) => void
  onClose: () => void
}

/* ── config ───────────────────────────────────────────────── */

const TYPE_CFG: Record<MissionType, { icon: React.ReactNode; label: string; color: string }> = {
  trivia:   { icon: <HelpCircle className="w-3.5 h-3.5" />, label: 'Trivia',   color: '#38BDF8' },
  photo:    { icon: <Camera     className="w-3.5 h-3.5" />, label: 'Foto',     color: '#C084FC' },
  creative: { icon: <Palette    className="w-3.5 h-3.5" />, label: 'Creativa', color: '#F472B6' },
}

const STATUS_CFG: Record<MissionStatus, { label: string; color: string; icon: React.ReactNode }> = {
  available: { label: 'Disponible', color: '#00f0ff', icon: <Star        className="w-3 h-3" /> },
  completed: { label: 'Completada', color: '#34c759', icon: <CheckCircle className="w-3 h-3" /> },
  review:    { label: 'En revisión', color: '#ff9500', icon: <Clock      className="w-3 h-3" /> },
  locked:    { label: 'Bloqueada',  color: '#64748b', icon: <Lock        className="w-3 h-3" /> },
}

/* ── component ────────────────────────────────────────────── */

export function MissionBottomSheet({
  chapter,
  completedCount,
  reviewCount,
  selectedMission,
  hasFragment,
  onGoToMission,
  onClose,
}: MissionBottomSheetProps) {
  const progress = (completedCount / chapter.totalMissions) * 100

  return (
    <div
      className="fixed left-0 right-0 z-40 flex flex-col items-center gap-3 px-5 pointer-events-none"
      style={{ bottom: 'max(20px, env(safe-area-inset-bottom))' }}
    >
      {/* ── Mission detail card (above the pill) ── */}
      {selectedMission && (() => {
        const typeInfo   = TYPE_CFG[selectedMission.type]
        const statusInfo = STATUS_CFG[selectedMission.status]
        return (
          <div
            className="glass-panel hud-scanline w-full rounded-3xl p-4 pointer-events-auto"
            style={{
              maxWidth: 440,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,240,255,0.05)',
              border: '1px solid rgba(0,240,255,0.2)',
            }}
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="flex items-center gap-1 text-xs font-semibold"
                    style={{ color: typeInfo.color, fontFamily: 'var(--font-exo2), sans-serif' }}
                  >
                    {typeInfo.icon} {typeInfo.label}
                  </span>
                  <span className="text-white/20">·</span>
                  <span className="relative group flex items-center gap-1 text-xs font-semibold cursor-default"
                    style={{ color: '#f9bd22', fontFamily: 'var(--font-exo2), sans-serif' }}>
                    <Star className="w-3 h-3 fill-current" />
                    {selectedMission.points} XP
                    <Tooltip text={`Ganarás ${selectedMission.points} puntos de experiencia al completar esta misión`} align="left" />
                  </span>
                </div>
                <h3
                  className="text-sm font-bold leading-snug text-white"
                  style={{ fontFamily: 'var(--font-cinzel), serif' }}
                >
                  {selectedMission.location}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
                  style={{
                    color: statusInfo.color,
                    background: `${statusInfo.color}18`,
                    border: `1px solid ${statusInfo.color}40`,
                    fontFamily: 'var(--font-exo2), sans-serif',
                  }}
                >
                  {statusInfo.icon} {statusInfo.label}
                </span>
                <button
                  onClick={onClose}
                  className="w-6 h-6 flex items-center justify-center rounded-full transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Question preview */}
            <p
              className="text-xs leading-relaxed line-clamp-2 mb-3"
              style={{
                color: 'rgba(255,255,255,0.55)',
                fontFamily: 'var(--font-exo2), sans-serif',
              }}
            >
              {selectedMission.question}
            </p>

            {/* CTA */}
            {selectedMission.status === 'available' && (
              <button
                onClick={() => onGoToMission(selectedMission.id)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl transition-all active:scale-[0.98] active:translate-y-0.75 font-bold text-sm uppercase tracking-widest text-white"
                style={{
                  fontFamily: 'var(--font-exo2), sans-serif',
                  background: 'linear-gradient(to bottom, #00d2ff, #00a8ff)',
                  boxShadow: '0 6px 0 rgba(0,0,0,0.25), inset 0 -3px 0 rgba(0,0,0,0.15), inset 0 3px 0 rgba(255,255,255,0.25), 0 0 20px rgba(0,168,255,0.4)',
                  border: '1.5px solid rgba(255,255,255,0.3)',
                }}
              >
                <MapPin className="w-4 h-4" />
                IR A LA MISIÓN
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {selectedMission.status !== 'available' && (
              <div
                className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold"
                style={{
                  color: statusInfo.color,
                  background: `${statusInfo.color}12`,
                  border: `1px solid ${statusInfo.color}30`,
                  fontFamily: 'var(--font-exo2), sans-serif',
                }}
              >
                {statusInfo.icon}
                {selectedMission.status === 'completed' && 'Misión completada'}
                {selectedMission.status === 'review'    && 'Esperando revisión del docente'}
                {selectedMission.status === 'locked'    && 'Completa el capítulo anterior'}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Chapter pill (always visible) ── */}
      <div
        className="glass-panel hud-scanline w-full rounded-full pointer-events-auto"
        style={{
          maxWidth: 440,
          boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Fragment icon */}
          <img src={chapter.fragment.icon} alt={chapter.fragment.name} className="shrink-0" style={{ width: 44, height: 44, objectFit: 'contain' }} />

          {/* Chapter title */}
          <div className="flex-1 min-w-0">
            <p
              className="text-[9px] uppercase tracking-widest font-bold leading-none mb-0.5"
              style={{ fontFamily: 'var(--font-exo2), sans-serif', color: '#00f0ff' }}
            >
              Capítulo {chapter.number}
            </p>
            <p
              className="text-[12px] font-bold leading-tight truncate text-white"
              style={{ fontFamily: 'var(--font-cinzel), serif' }}
            >
              {chapter.title}
            </p>
          </div>

          {/* Progress bar + % */}
          <div className="relative group flex items-center gap-2 shrink-0 cursor-default">
            <div
              className="w-16 h-2 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <div
                className="h-full rounded-full relative overflow-hidden"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #00a8ff, #00f0ff)',
                  boxShadow: '0 0 6px rgba(0,240,255,0.6)',
                  transition: 'width 0.7s ease',
                }}
              />
            </div>
            <span
              className="text-[11px] font-bold tabular-nums"
              style={{ fontFamily: 'var(--font-exo2), sans-serif', color: '#00f0ff' }}
            >
              {Math.round(progress)}%
            </span>
            <Tooltip text={`${completedCount} de ${chapter.totalMissions} misiones completadas en este capítulo`} align="right" />
          </div>

          {/* Fragment + review badges */}
          <div className="flex items-center gap-1.5 shrink-0">
            {reviewCount > 0 && (
              <div className="relative group cursor-default">
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    background: 'rgba(255,149,0,0.15)',
                    border: '1px solid rgba(255,149,0,0.4)',
                    color: '#ff9500',
                    fontFamily: 'var(--font-exo2), sans-serif',
                  }}
                >
                  <Clock className="w-2.5 h-2.5" />
                  {reviewCount}
                </div>
                <Tooltip text={`${reviewCount} misión${reviewCount > 1 ? 'es' : ''} enviada${reviewCount > 1 ? 's' : ''} esperando revisión del docente`} align="right" />
              </div>
            )}
            <div className="relative group cursor-default">
              <span className="text-base">{hasFragment ? '✨' : '🔒'}</span>
              <Tooltip
                text={hasFragment
                  ? `¡Fragmento "${chapter.fragment.name}" desbloqueado!`
                  : `Completa todas las misiones para desbloquear el fragmento "${chapter.fragment.name}"`}
                align="right"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
