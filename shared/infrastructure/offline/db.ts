import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

const DB_NAME = 'guardianes-offline'
const DB_VERSION = 1

export interface PendingResponse {
  id: string
  teamId: number
  missionId: string
  answer: number | string
  type: 'trivia' | 'photo' | 'creative'
  createdAt: number
  retries: number
}

export interface PendingPhoto {
  id: string
  teamId: number
  missionId: string
  blob: Blob
  originalName: string
  createdAt: number
  retries: number
}

interface OfflineDB extends DBSchema {
  pending_responses: {
    key: string
    value: PendingResponse
    indexes: { 'by-created': number }
  }
  pending_photos: {
    key: string
    value: PendingPhoto
    indexes: { 'by-created': number }
  }
  cached_missions: {
    key: string
    value: { id: string; data: unknown; cachedAt: number }
  }
}

let _dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null

function getDb(): Promise<IDBPDatabase<OfflineDB>> {
  if (!_dbPromise) {
    _dbPromise = openDB<OfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('pending_responses')) {
          const respStore = db.createObjectStore('pending_responses', { keyPath: 'id' })
          respStore.createIndex('by-created', 'createdAt')
        }
        if (!db.objectStoreNames.contains('pending_photos')) {
          const photoStore = db.createObjectStore('pending_photos', { keyPath: 'id' })
          photoStore.createIndex('by-created', 'createdAt')
        }
        if (!db.objectStoreNames.contains('cached_missions')) {
          db.createObjectStore('cached_missions', { keyPath: 'id' })
        }
      },
    })
  }
  return _dbPromise
}

/* ── Pending responses queue ── */

export async function queueResponse(resp: Omit<PendingResponse, 'id' | 'createdAt' | 'retries'>): Promise<string> {
  const db = await getDb()
  const id = crypto.randomUUID()
  await db.add('pending_responses', { ...resp, id, createdAt: Date.now(), retries: 0 })
  return id
}

export async function getAllPendingResponses(): Promise<PendingResponse[]> {
  const db = await getDb()
  return db.getAll('pending_responses')
}

export async function removePendingResponse(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('pending_responses', id)
}

export async function countPendingResponses(): Promise<number> {
  const db = await getDb()
  return db.count('pending_responses')
}

/* ── Pending photos queue ── */

export async function queuePhoto(photo: Omit<PendingPhoto, 'id' | 'createdAt' | 'retries'>): Promise<string> {
  const db = await getDb()
  const id = crypto.randomUUID()
  await db.add('pending_photos', { ...photo, id, createdAt: Date.now(), retries: 0 })
  return id
}

export async function getAllPendingPhotos(): Promise<PendingPhoto[]> {
  const db = await getDb()
  return db.getAll('pending_photos')
}

export async function removePendingPhoto(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('pending_photos', id)
}

export async function countPendingPhotos(): Promise<number> {
  const db = await getDb()
  return db.count('pending_photos')
}

/* ── Mission cache ── */

export async function cacheMissionData(id: string, data: unknown): Promise<void> {
  const db = await getDb()
  await db.put('cached_missions', { id, data, cachedAt: Date.now() })
}

export async function getCachedMission<T>(id: string): Promise<T | null> {
  const db = await getDb()
  const entry = await db.get('cached_missions', id)
  return entry ? (entry.data as T) : null
}

/* ── Queue size for UI badge ── */

export async function getTotalPendingCount(): Promise<number> {
  return (await countPendingResponses()) + (await countPendingPhotos())
}
