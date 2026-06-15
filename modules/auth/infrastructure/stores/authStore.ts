import { create } from 'zustand'
import usersRaw from '@/data/json/users.json'

/* ── types ────────────────────────────────────────────────── */

export type Role = 'student' | 'leader' | 'director' | 'admin'

interface MockUser {
  id: string
  name: string
  username: string
  password: string
  role: Role
  teamId?: string
  schoolName?: string
  color: string
  level?: number
  levelTitle?: string
}

export interface AuthUser {
  id: string
  name: string
  username: string
  role: Role
  teamId?: string
  schoolName?: string
  color: string
  level?: number
  levelTitle?: string
}

interface AuthState {
  user: AuthUser | null
  isHydrated: boolean
  hydrate: () => void
  login: (username: string, password: string) => 'ok' | 'invalid'
  loginAs: (role: Role) => void
  logout: () => void
}

/* ── helpers ──────────────────────────────────────────────── */

const STORAGE_KEY = 'guardianes-auth'
const mockUsers = usersRaw as MockUser[]

function toAuthUser(u: MockUser): AuthUser {
  return {
    id:          u.id,
    name:        u.name,
    username:    u.username,
    role:        u.role,
    teamId:      u.teamId,
    schoolName:  u.schoolName,
    color:       u.color,
    level:       u.level,
    levelTitle:  u.levelTitle,
  }
}

/* ── store ────────────────────────────────────────────────── */

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isHydrated: false,

  hydrate: () => {
    if (typeof window === 'undefined') { set({ isHydrated: true }); return }
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        set({ user: JSON.parse(stored) as AuthUser, isHydrated: true })
        return
      }
    } catch { /* ignore malformed data */ }
    set({ isHydrated: true })
  },

  login: (username, password) => {
    const found = mockUsers.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    )
    if (!found) return 'invalid'
    const authUser = toAuthUser(found)
    set({ user: authUser })
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
    }
    return 'ok'
  },

  loginAs: (role) => {
    const found = mockUsers.find(u => u.role === role)
    if (!found) return
    const authUser = toAuthUser(found)
    set({ user: authUser })
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
    }
  },

  logout: () => {
    set({ user: null })
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  },
}))

/* ── role-based redirect helper ───────────────────────────── */

export const ROLE_REDIRECT: Record<Role, string> = {
  student:  '/mapa',
  leader:   '/mapa',
  director: '/mapa',
  admin:    '/mapa',
}

export const ROLE_PANEL: Record<Role, string> = {
  student:  '/student/panel',
  leader:   '/leader/panel',
  director: '/director/panel',
  admin:    '/admin/panel',
}
