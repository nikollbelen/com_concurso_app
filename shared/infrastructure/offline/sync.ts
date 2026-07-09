import { supabase } from '@/shared/infrastructure/supabase/client'
import {
  getAllPendingResponses,
  removePendingResponse,
  getAllPendingPhotos,
  removePendingPhoto,
} from './db'

type SyncResult = { synced: number; failed: number }

/**
 * Replay all queued responses and photos against Supabase.
 * Text responses first, then photos (heavier).
 */
export async function replayQueue(teamId: number): Promise<SyncResult> {
  let synced = 0
  let failed = 0

  // 1. Text responses first (lightweight)
  const responses = await getAllPendingResponses()
  for (const resp of responses) {
    if (resp.teamId !== teamId) continue
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('mission_progression')
        .upsert(
          {
            team_id: resp.teamId,
            mission_id: resp.missionId,
            status: resp.type === 'trivia' ? 'completed' : 'review',
            // For trivia, store the selected answer index
            ...(resp.type === 'trivia' && { answer: resp.answer }),
          },
          { onConflict: 'team_id, mission_id' },
        )

      if (error) {
        failed++
        continue
      }
      await removePendingResponse(resp.id)
      synced++
    } catch {
      failed++
    }
  }

  // 2. Photos after (heavier payload)
  const photos = await getAllPendingPhotos()
  for (const photo of photos) {
    if (photo.teamId !== teamId) continue
    try {
      // Upload photo to Supabase Storage
      const filePath = `evidencias/${photo.teamId}/${photo.missionId}_${Date.now()}.webp`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: uploadError } = await (supabase as any).storage
        .from('evidencias')
        .upload(filePath, photo.blob, { contentType: 'image/webp', upsert: false })

      if (uploadError) {
        failed++
        continue
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: { publicUrl } } = (supabase as any).storage.from('evidencias').getPublicUrl(filePath)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('mission_progression')
        .upsert(
          {
            team_id: photo.teamId,
            mission_id: photo.missionId,
            status: 'review',
            photo: publicUrl,
          },
          { onConflict: 'team_id, mission_id' },
        )

      if (updateError) {
        failed++
        continue
      }

      await removePendingPhoto(photo.id)
      synced++
    } catch {
      failed++
    }
  }

  return { synced, failed }
}
