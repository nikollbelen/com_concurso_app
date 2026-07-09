'use client'

import { useCallback, useState } from 'react'
import { supabase } from '@/shared/infrastructure/supabase/client'
import { queueResponse, queuePhoto } from '@/shared/infrastructure/offline/db'
import { compressImage } from '@/shared/infrastructure/offline/photo-compressor'

export interface SubmitResult {
  ok: boolean
  synced: boolean       // true = sent to Supabase now, false = queued for later
  status: 'completed' | 'review' | 'pending_sync'
}

interface SubmitTriviaParams {
  teamId: number
  missionId: string
  selectedAnswer: number
}

interface SubmitPhotoParams {
  teamId: number
  missionId: string
  file: File
}

interface SubmitCreativeParams {
  teamId: number
  missionId: string
  text: string
}

export function useSubmitMission() {
  const [submitting, setSubmitting] = useState(false)

  const submitTrivia = useCallback(async (params: SubmitTriviaParams): Promise<SubmitResult> => {
    setSubmitting(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('mission_progression')
        .upsert(
          {
            team_id: params.teamId,
            mission_id: params.missionId,
            status: 'completed',
            answer: String(params.selectedAnswer),
          },
          { onConflict: 'team_id, mission_id' },
        )

      if (!error) {
        return { ok: true, synced: true, status: 'completed' }
      }
      // If online failed, queue
      await queueResponse({
        teamId: params.teamId,
        missionId: params.missionId,
        answer: params.selectedAnswer,
        type: 'trivia',
      })
      return { ok: true, synced: false, status: 'pending_sync' }
    } catch {
      // Offline or network error — queue
      await queueResponse({
        teamId: params.teamId,
        missionId: params.missionId,
        answer: params.selectedAnswer,
        type: 'trivia',
      })
      return { ok: true, synced: false, status: 'pending_sync' }
    } finally {
      setSubmitting(false)
    }
  }, [])

  const submitPhoto = useCallback(async (params: SubmitPhotoParams): Promise<SubmitResult> => {
    setSubmitting(true)
    try {
      // Compress to WebP first
      const compressed = await compressImage(params.file)
      const filePath = `evidencias/${params.teamId}/${params.missionId}_${Date.now()}.webp`

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: uploadError } = await (supabase as any).storage
        .from('evidencias')
        .upload(filePath, compressed, { contentType: 'image/webp', upsert: false })

      if (!uploadError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: { publicUrl } } = (supabase as any).storage.from('evidencias').getPublicUrl(filePath)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase as any)
          .from('mission_progression')
          .upsert(
            { team_id: params.teamId, mission_id: params.missionId, status: 'review', photo: publicUrl },
            { onConflict: 'team_id, mission_id' },
          )

        if (!updateError) {
          return { ok: true, synced: true, status: 'review' }
        }
      }
      // Fallback: queue photo
      await queuePhoto({
        teamId: params.teamId,
        missionId: params.missionId,
        blob: compressed,
        originalName: params.file.name,
      })
      return { ok: true, synced: false, status: 'pending_sync' }
    } catch {
      await queuePhoto({
        teamId: params.teamId,
        missionId: params.missionId,
        blob: await compressImage(params.file),
        originalName: params.file.name,
      })
      return { ok: true, synced: false, status: 'pending_sync' }
    } finally {
      setSubmitting(false)
    }
  }, [])

  const submitCreative = useCallback(async (params: SubmitCreativeParams): Promise<SubmitResult> => {
    setSubmitting(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('mission_progression')
        .upsert(
          {
            team_id: params.teamId,
            mission_id: params.missionId,
            status: 'review',
            answer: params.text,
          },
          { onConflict: 'team_id, mission_id' },
        )

      if (!error) {
        return { ok: true, synced: true, status: 'review' }
      }
      await queueResponse({
        teamId: params.teamId,
        missionId: params.missionId,
        answer: params.text,
        type: 'creative',
      })
      return { ok: true, synced: false, status: 'pending_sync' }
    } catch {
      await queueResponse({
        teamId: params.teamId,
        missionId: params.missionId,
        answer: params.text,
        type: 'creative',
      })
      return { ok: true, synced: false, status: 'pending_sync' }
    } finally {
      setSubmitting(false)
    }
  }, [])

  return { submitTrivia, submitPhoto, submitCreative, submitting }
}
