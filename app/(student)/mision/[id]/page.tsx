'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ChevronLeft, MapPin, Camera, HelpCircle, Palette,
  CheckCircle, Clock, Lock, Star, Send, RotateCcw, Wifi, WifiOff, CloudOff, RefreshCw,
} from 'lucide-react'
import { useAuthStore } from '@/modules/auth/infrastructure/stores/authStore'

import { useMission }      from '@/modules/missions/presentation/hooks/useMissions'
import { useChapters }     from '@/modules/chapters/presentation/hooks/useChapters'
import { useTeam }         from '@/modules/teams/presentation/hooks/useTeam'
import { useTeamProgress } from '@/modules/missions/presentation/hooks/useTeamProgress'
import { useAssignedQuestion } from '@/modules/missions/presentation/hooks/useMissionQuestion'
import { useOfflineSync }  from '@/modules/missions/presentation/hooks/useOfflineSync'
import { useSubmitMission, type SubmitResult } from '@/modules/missions/presentation/hooks/useSubmitMission'
import { Tooltip } from '@/shared/ui/components/Tooltip'

type MissionStatus = 'available' | 'in_progress' | 'completed' | 'review' | 'locked'

const TYPE_CFG = {
  trivia:   { icon: <HelpCircle className="w-4 h-4" />, label: 'Trivia',   color: '#38BDF8', desc: 'Responde correctamente la pregunta' },
  photo:    { icon: <Camera     className="w-4 h-4" />, label: 'Foto',     color: '#C084FC', desc: 'Captura evidencia fotográfica' },
  creative: { icon: <Palette    className="w-4 h-4" />, label: 'Creativa', color: '#F472B6', desc: 'Demuestra tu creatividad' },
}

export default function MisionPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { user, isHydrated, hydrate } = useAuthStore()

  /* ─ server state (Supabase vía TanStack Query) ─ */
  const { data: mission, isLoading: missionLoading } = useMission(id)
  const { data: chapters = [] } = useChapters()
  const { data: team }          = useTeam(user?.teamId)
  const { data: progressData }  = useTeamProgress(user?.teamId)
  const { data: assignedQuestion } = useAssignedQuestion(user?.teamId, id)

  const [selected,  setSelected]  = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [subResult, setSubResult] = useState<SubmitResult | null>(null)
  const [photoDesc, setPhotoDesc] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [creativeText, setCreativeText] = useState('')

  const { isOnline, pendingCount, syncStatus, triggerSync } = useOfflineSync(user?.teamId)
  const { submitTrivia, submitPhoto, submitCreative, submitting } = useSubmitMission()

  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => {
    if (isHydrated && !user) router.replace('/login')
  }, [user, isHydrated, router])

  const handleSubmitTrivia = useCallback(async () => {
    if (selected === null || !user?.teamId) return
    const result = await submitTrivia({
      teamId: user.teamId,
      missionId: id,
      selectedAnswer: selected,
    })
    setSubmitted(true)
    setSubResult(result)
  }, [selected, user?.teamId, id, submitTrivia])

  const handleSubmitPhoto = useCallback(async () => {
    if (!photoFile || !user?.teamId) return
    const result = await submitPhoto({
      teamId: user.teamId,
      missionId: id,
      file: photoFile,
    })
    setSubmitted(true)
    setSubResult(result)
  }, [photoFile, user?.teamId, id, submitPhoto])

  const handleSubmitCreative = useCallback(async () => {
    if (!creativeText.trim() || !user?.teamId) return
    const result = await submitCreative({
      teamId: user.teamId,
      missionId: id,
      text: creativeText,
    })
    setSubmitted(true)
    setSubResult(result)
  }, [creativeText, user?.teamId, id, submitCreative])

  if (!isHydrated || !user) return null

  if (missionLoading || chapters.length === 0) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1117' }}>
      <p className="text-sm uppercase tracking-widest" style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.3)' }}>
        Cargando misión…
      </p>
    </div>
  )

  if (!mission) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1117' }}>
      <div className="text-center">
        <p className="text-white font-bold mb-3">Misión no encontrada</p>
        <button onClick={() => router.push('/mapa')} className="px-4 py-2 rounded-xl text-sm" style={{ background: 'rgba(0,168,255,0.2)', color: '#00f0ff', fontFamily: 'var(--font-exo2), sans-serif' }}>
          Volver al mapa
        </button>
      </div>
    </div>
  )

  const chapter = chapters.find(c => c.id === mission.chapterId)!
  const teamLevel = team?.level ?? user.level ?? 1
  const isLocked = chapter.requiredLevel > teamLevel
  const progress = progressData?.[mission.id] as MissionStatus | undefined
  const status: MissionStatus = isLocked ? 'locked' : progress ?? 'available'
  // `available` (nunca empezada) e `in_progress` (ya en el lugar) comparten la
  // misma UI de resolución.
  const canSolve = status === 'available' || status === 'in_progress'

  const typeCfg  = TYPE_CFG[mission.type]

  // Trivia: usa la VARIANTE asignada al equipo al empezar. Si aún no hay una
  // (misión no empezada, o BD sin variantes) cae a la pregunta base de la misión.
  const trivia = assignedQuestion ?? {
    question: mission.question,
    options: mission.options,
    correctAnswer: mission.correctAnswer,
  }
  const isCorrect = selected === trivia.correctAnswer

  return (
    <div className="min-h-screen" style={{ background: '#0d1117', fontFamily: 'var(--font-exo2), sans-serif' }}>

      {/* Header */}
      <div className="sticky top-0 z-30 glass-panel hud-scanline px-5 py-4 flex items-center gap-3"
        style={{ borderBottom: '1px solid rgba(0,240,255,0.15)' }}>
        <button onClick={() => router.push('/mapa')}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <img src={chapter.fragment.icon} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
            <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: chapter.color }}>
              Capítulo {chapter.number} · {chapter.title}
            </p>
          </div>
          <p className="text-sm font-bold text-white truncate" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
            {mission.location}
          </p>
        </div>

        {/* Sync status badge */}
        {!isOnline && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl shrink-0"
            style={{ background: 'rgba(255,149,0,0.12)', border: '1px solid rgba(255,149,0,0.3)' }}>
            <WifiOff className="w-3.5 h-3.5" style={{ color: '#ff9500' }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#ff9500' }}>
              Sin conexión
            </span>
          </div>
        )}
        {isOnline && pendingCount > 0 && (
          <button onClick={triggerSync} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl shrink-0"
            style={{ background: 'rgba(0,168,255,0.12)', border: '1px solid rgba(0,168,255,0.3)' }}>
            <RefreshCw className="w-3.5 h-3.5" style={{ color: '#00a8ff' }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#00a8ff' }}>
              {syncStatus === 'syncing' ? 'Sincronizando…' : `${pendingCount} pendiente${pendingCount > 1 ? 's' : ''}`}
            </span>
          </button>
        )}

        <div className="relative group shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(249,189,34,0.12)', border: '1px solid rgba(249,189,34,0.3)' }}>
            <Star className="w-3.5 h-3.5 fill-current" style={{ color: '#f9bd22' }} />
            <span className="text-sm font-black" style={{ color: '#f9bd22' }}>{mission.points} XP</span>
          </div>
          <Tooltip text={`Ganarás ${mission.points} puntos al completar esta misión`} />
        </div>
      </div>

      <div className="p-5 mx-auto max-w-2xl lg:max-w-4xl flex flex-col gap-4 pb-10 lg:px-8">

        {/* Type badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: `${typeCfg.color}15`, border: `1px solid ${typeCfg.color}40`, color: typeCfg.color }}>
            {typeCfg.icon} {typeCfg.label}
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{typeCfg.desc}</p>
        </div>

        {/* Location card */}
        <div className="glass-panel hud-scanline rounded-2xl p-4 flex items-center gap-3"
          style={{ border: '1px solid rgba(0,240,255,0.15)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(0,168,255,0.12)', border: '1px solid rgba(0,168,255,0.25)' }}>
            <MapPin className="w-5 h-5" style={{ color: '#00a8ff' }} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold mb-0.5" style={{ color: '#00f0ff' }}>Ubicación</p>
            <p className="text-sm font-bold text-white">{mission.location}</p>
          </div>
        </div>

        {/* ─── STATUS: locked ─── */}
        {status === 'locked' && (
          <div className="glass-panel hud-scanline rounded-3xl p-6 text-center"
            style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            <Lock className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p className="text-base font-black text-white mb-1" style={{ fontFamily: 'var(--font-cinzel), serif' }}>Misión bloqueada</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Completa el capítulo anterior para desbloquear este.</p>
          </div>
        )}

        {/* ─── STATUS: completed ─── */}
        {status === 'completed' && (
          <div className="glass-panel hud-scanline rounded-3xl p-6 text-center"
            style={{ border: '1px solid rgba(0,230,118,0.3)', boxShadow: '0 0 30px rgba(0,230,118,0.1)' }}>
            <CheckCircle className="w-14 h-14 mx-auto mb-3" style={{ color: '#00e676' }} />
            <p className="text-base font-black text-white mb-1" style={{ fontFamily: 'var(--font-cinzel), serif' }}>¡Misión completada!</p>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Obtuviste {mission.points} XP por esta misión.</p>
            <button onClick={() => router.push('/mapa')}
              className="flex items-center justify-center gap-2 mx-auto px-6 py-3 rounded-2xl text-sm font-bold text-white uppercase tracking-widest"
              style={{ background: 'linear-gradient(to bottom,#00d2ff,#00a8ff)', boxShadow: '0 4px 0 rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)' }}>
              Volver al mapa
            </button>
          </div>
        )}

        {/* ─── STATUS: review ─── */}
        {status === 'review' && (
          <div className="glass-panel hud-scanline rounded-3xl p-6 text-center"
            style={{ border: '1px solid rgba(255,149,0,0.35)', boxShadow: '0 0 30px rgba(255,149,0,0.08)' }}>
            <Clock className="w-14 h-14 mx-auto mb-3" style={{ color: '#ff9500' }} />
            <p className="text-base font-black text-white mb-1" style={{ fontFamily: 'var(--font-cinzel), serif' }}>En revisión</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Tu evidencia fue enviada. El docente la revisará pronto.</p>
          </div>
        )}

        {/* ─── STATUS: resolver — TRIVIA ─── */}
        {canSolve && mission.type === 'trivia' && (
          <>
            <div className="glass-panel hud-scanline rounded-2xl p-4"
              style={{ border: '1px solid rgba(56,189,248,0.2)' }}>
              <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: '#38BDF8' }}>Pregunta</p>
              <p className="text-sm font-bold text-white leading-relaxed">{trivia.question}</p>
            </div>

            <div className="flex flex-col gap-2">
              {trivia.options.map((opt, i) => {
                let bg = 'rgba(255,255,255,0.04)'
                let border = '1px solid rgba(255,255,255,0.1)'
                let color = 'rgba(255,255,255,0.8)'
                if (selected === i && !submitted) { bg = 'rgba(0,168,255,0.15)'; border = '1px solid rgba(0,168,255,0.5)'; color = '#fff' }
                if (submitted && i === trivia.correctAnswer) { bg = 'rgba(0,230,118,0.15)'; border = '1px solid rgba(0,230,118,0.5)'; color = '#00e676' }
                if (submitted && selected === i && i !== trivia.correctAnswer) { bg = 'rgba(255,59,48,0.15)'; border = '1px solid rgba(255,59,48,0.5)'; color = '#ff6b6b' }
                return (
                  <button key={i} onClick={() => !submitted && setSelected(i)} disabled={submitted}
                    className="w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3 transition-all"
                    style={{ background: bg, border, color, fontFamily: 'var(--font-exo2), sans-serif' }}>
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                      style={{ background: selected === i && !submitted ? 'rgba(0,168,255,0.3)' : 'rgba(255,255,255,0.08)', color: selected === i ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm font-semibold">{opt}</span>
                    {submitted && i === trivia.correctAnswer && <CheckCircle className="w-4 h-4 ml-auto shrink-0" style={{ color: '#00e676' }} />}
                  </button>
                )
              })}
            </div>

            {!submitted ? (
              <button onClick={handleSubmitTrivia}
                disabled={selected === null || submitting}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest text-white disabled:opacity-40"
                style={{ fontFamily: 'var(--font-exo2), sans-serif', background: 'linear-gradient(to bottom,#00d2ff,#00a8ff)', boxShadow: selected !== null ? '0 6px 0 rgba(0,0,0,0.25), inset 0 -3px 0 rgba(0,0,0,0.15), inset 0 3px 0 rgba(255,255,255,0.25)' : 'none', border: '1.5px solid rgba(255,255,255,0.2)' }}>
                {submitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Enviando…</> : <><Send className="w-4 h-4" /> Confirmar respuesta</>}
              </button>
            ) : (
              <div className="glass-panel hud-scanline rounded-3xl p-5 text-center"
                style={{ border: !subResult?.synced ? '1px solid rgba(255,149,0,0.4)' : (isCorrect ? '1px solid rgba(0,230,118,0.4)' : '1px solid rgba(255,59,48,0.4)') }}>
                {subResult?.synced ? (
                  <>
                    <p className="text-xl mb-1" style={{ fontFamily: 'var(--font-cinzel), serif', color: isCorrect ? '#00e676' : '#ff6b6b', fontWeight: 900 }}>
                      {isCorrect ? '¡Correcto!' : 'Incorrecto'}
                    </p>
                    <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {isCorrect ? `+${mission.points} XP añadidos a tu equipo` : `La respuesta correcta era: ${trivia.options[trivia.correctAnswer]}`}
                    </p>
                  </>
                ) : (
                  <>
                    <CloudOff className="w-10 h-10 mx-auto mb-2" style={{ color: '#ff9500' }} />
                    <p className="text-base font-black text-white mb-1" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
                      Respuesta guardada
                    </p>
                    <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      Sin conexión. Se sincronizará automáticamente cuando recuperes la señal.
                    </p>
                  </>
                )}
                <div className="flex gap-3">
                  {!isCorrect && subResult?.synced && (
                    <button onClick={() => { setSelected(null); setSubmitted(false); setSubResult(null) }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-exo2), sans-serif' }}>
                      <RotateCcw className="w-4 h-4" /> Reintentar
                    </button>
                  )}
                  <button onClick={() => router.push('/mapa')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(to bottom,#00d2ff,#00a8ff)', boxShadow: '0 4px 0 rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)', fontFamily: 'var(--font-exo2), sans-serif' }}>
                    Volver al mapa
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── STATUS: resolver — PHOTO ─── */}
        {canSolve && mission.type === 'photo' && (
          <>
            <div className="glass-panel hud-scanline rounded-2xl p-4"
              style={{ border: '1px solid rgba(192,132,252,0.2)' }}>
              <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: '#C084FC' }}>Evidencia requerida</p>
              <p className="text-sm font-bold text-white leading-relaxed">{mission.question}</p>
            </div>

            {!submitted ? (
              <>
                <label className="w-full flex flex-col items-center justify-center gap-3 py-10 rounded-3xl border-2 border-dashed transition-all cursor-pointer"
                  style={{ borderColor: photoFile ? 'rgba(0,230,118,0.4)' : 'rgba(192,132,252,0.3)', background: photoFile ? 'rgba(0,230,118,0.06)' : 'rgba(192,132,252,0.05)' }}>
                  <input type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={e => setPhotoFile(e.target.files?.[0] ?? null)} />
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: photoFile ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(192,132,252,0.3)' }}>
                    <Camera className="w-7 h-7" style={{ color: photoFile ? '#00e676' : '#C084FC' }} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-white">{photoFile ? photoFile.name : 'Tomar foto o subir imagen'}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {photoFile ? `Se comprimirá a WebP (~${Math.round(photoFile.size / 1024)} KB → ~200 KB)` : 'Soporta JPG y PNG · máx. 10 MB'}
                    </p>
                  </div>
                </label>
                <button onClick={handleSubmitPhoto} disabled={!photoFile || submitting}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest text-white disabled:opacity-40"
                  style={{ fontFamily: 'var(--font-exo2), sans-serif', background: 'linear-gradient(to bottom,#d8a5ff,#a855f7)', boxShadow: photoFile ? '0 6px 0 rgba(0,0,0,0.25), inset 0 -3px 0 rgba(0,0,0,0.15), inset 0 3px 0 rgba(255,255,255,0.25)' : 'none', border: '1.5px solid rgba(255,255,255,0.2)' }}>
                  {submitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Comprimiendo y enviando…</> : <><Send className="w-4 h-4" /> Enviar evidencia</>}
                </button>
              </>
            ) : (
              <div className="glass-panel hud-scanline rounded-3xl p-5 text-center"
                style={{ border: subResult?.synced ? '1px solid rgba(255,149,0,0.4)' : '1px solid rgba(255,149,0,0.4)' }}>
                {subResult?.synced ? (
                  <>
                    <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: '#ff9500' }} />
                    <p className="text-base font-black text-white mb-1" style={{ fontFamily: 'var(--font-cinzel), serif' }}>Evidencia enviada</p>
                    <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>El docente revisará tu fotografía y asignará los {mission.points} XP si es válida.</p>
                  </>
                ) : (
                  <>
                    <CloudOff className="w-10 h-10 mx-auto mb-2" style={{ color: '#ff9500' }} />
                    <p className="text-base font-black text-white mb-1" style={{ fontFamily: 'var(--font-cinzel), serif' }}>Foto guardada</p>
                    <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      Sin conexión. Se sincronizará cuando recuperes la señal (comprimida a WebP).
                    </p>
                  </>
                )}
                <button onClick={() => router.push('/mapa')}
                  className="flex items-center justify-center gap-2 mx-auto px-6 py-3 rounded-2xl text-sm font-bold text-white uppercase tracking-widest"
                  style={{ background: 'linear-gradient(to bottom,#00d2ff,#00a8ff)', boxShadow: '0 4px 0 rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)', fontFamily: 'var(--font-exo2), sans-serif' }}>
                  Volver al mapa
                </button>
              </div>
            )}
          </>
        )}

        {/* ─── STATUS: resolver — CREATIVE ─── */}
        {canSolve && mission.type === 'creative' && (
          <>
            <div className="glass-panel hud-scanline rounded-2xl p-4"
              style={{ border: '1px solid rgba(244,114,182,0.2)' }}>
              <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: '#F472B6' }}>Desafío creativo</p>
              <p className="text-sm font-bold text-white leading-relaxed">{mission.question}</p>
            </div>
            {!submitted ? (
              <>
                <textarea
                  value={creativeText}
                  onChange={e => setCreativeText(e.target.value)}
                  placeholder="Escribe tu respuesta creativa aquí..."
                  rows={5}
                  className="w-full resize-none rounded-2xl p-4 text-sm text-white placeholder:text-white/25 outline-none"
                  style={{ background: 'rgba(244,114,182,0.06)', border: '1px solid rgba(244,114,182,0.25)', fontFamily: 'var(--font-exo2), sans-serif' }}
                />
                <button onClick={handleSubmitCreative} disabled={!creativeText.trim() || submitting}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest text-white disabled:opacity-40"
                  style={{ fontFamily: 'var(--font-exo2), sans-serif', background: 'linear-gradient(to bottom,#f9a8d4,#ec4899)', boxShadow: creativeText.trim() ? '0 6px 0 rgba(0,0,0,0.25)' : 'none', border: '1.5px solid rgba(255,255,255,0.2)' }}>
                  {submitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Enviando…</> : <><Send className="w-4 h-4" /> Enviar respuesta</>}
                </button>
              </>
            ) : (
              <div className="glass-panel hud-scanline rounded-3xl p-5 text-center"
                style={{ border: subResult?.synced ? '1px solid rgba(255,149,0,0.4)' : '1px solid rgba(255,149,0,0.4)' }}>
                {subResult?.synced ? (
                  <>
                    <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: '#ff9500' }} />
                    <p className="text-base font-black text-white mb-1" style={{ fontFamily: 'var(--font-cinzel), serif' }}>Respuesta enviada</p>
                    <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>El jurado revisará tu respuesta creativa y asignará hasta {mission.points} XP.</p>
                  </>
                ) : (
                  <>
                    <CloudOff className="w-10 h-10 mx-auto mb-2" style={{ color: '#ff9500' }} />
                    <p className="text-base font-black text-white mb-1" style={{ fontFamily: 'var(--font-cinzel), serif' }}>Respuesta guardada</p>
                    <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      Sin conexión. Se sincronizará automáticamente cuando recuperes la señal.
                    </p>
                  </>
                )}
                <button onClick={() => router.push('/mapa')}
                  className="flex items-center justify-center gap-2 mx-auto px-6 py-3 rounded-2xl text-sm font-bold text-white uppercase tracking-widest"
                  style={{ background: 'linear-gradient(to bottom,#00d2ff,#00a8ff)', boxShadow: '0 4px 0 rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)', fontFamily: 'var(--font-exo2), sans-serif' }}>
                  Volver al mapa
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
