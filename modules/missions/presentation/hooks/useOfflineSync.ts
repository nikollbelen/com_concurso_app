'use client'

import { useEffect, useCallback, useState } from 'react'
import { getTotalPendingCount } from '@/shared/infrastructure/offline/db'
import { replayQueue } from '@/shared/infrastructure/offline/sync'

export type SyncStatus = 'idle' | 'syncing' | 'done' | 'error'

interface UseOfflineSyncReturn {
  isOnline: boolean
  pendingCount: number
  syncStatus: SyncStatus
  triggerSync: () => Promise<void>
}

export function useOfflineSync(teamId: number | undefined): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')

  const refreshPendingCount = useCallback(async () => {
    const count = await getTotalPendingCount()
    setPendingCount(count)
  }, [])

  const triggerSync = useCallback(async () => {
    if (!teamId) return
    setSyncStatus('syncing')
    try {
      const result = await replayQueue(teamId)
      setSyncStatus(result.failed > 0 && result.synced === 0 ? 'error' : 'done')
      await refreshPendingCount()
    } catch {
      setSyncStatus('error')
    }
  }, [teamId, refreshPendingCount])

  useEffect(() => {
    refreshPendingCount()

    const handleOnline = async () => {
      setIsOnline(true)
      // Auto-sync when coming back online
      if (teamId) {
        await triggerSync()
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [teamId, triggerSync, refreshPendingCount])

  return { isOnline, pendingCount, syncStatus, triggerSync }
}
