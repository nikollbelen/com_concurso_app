import { create } from 'zustand'
import { supabase } from '@/shared/infrastructure/supabase/client'
import { isDemoMode } from '@/shared/infrastructure/demo/config'
import { clearStoredDemoUser, demoLogin, getStoredDemoUser } from '@/shared/infrastructure/demo/demo-data'

export type Role = 'student' | 'leader' | 'director' | 'admin'

export interface AuthUser {
  id: string
  name: string
  username: string
  role: Role
  teamId?: number
  schoolId?: string
  schoolShortName?: string
  schoolName?: string
  color: string
  level?: number
  levelTitle?: string
}

interface AuthState {
  user: AuthUser | null
  isHydrated: boolean
  isLoggingOut: boolean
  hydrate: () => Promise<void>
  login: (alias: string, pin: string) => Promise<'ok' | 'invalid'>
  logout: () => Promise<void>
}

interface UsuarioRow {
  alias: string
  nombre: string
  apellidos: string | null
  team_id: number | null
  roles: { type: string } | null
  schools: { id:string,  name: string; short: string; color: string | null } | null
  // `levels` viene embebido vía la FK teams.level → levels.level
  teams: { level: number | null; levels: { title: string | null } | null } | null
}

async function fetchProfile(userId: string): Promise<AuthUser | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('usuarios')
    .select('alias, nombre, apellidos, team_id, roles ( type ), schools ( id, name, short, color ), teams!usuarios_team_id_fkey ( level, levels ( title ) )')
    .eq('id', userId)
    .single() as { data: UsuarioRow | null; error: { code?: string; message?: string; details?: string } | null }

  console.log('[fetchProfile] error →', error?.code, error?.message, error?.details)
  console.log('[fetchProfile] data →', data)
  if (error || !data) return null

  const row = data
  const level  = row.teams?.level ?? 1

  return {
    id:          userId,
    name:        [row.nombre, row.apellidos].filter(Boolean).join(' '),
    username:    row.alias,
    role:        (row.roles?.type ?? 'student') as Role,
    teamId:      row.team_id ?? undefined,
    schoolId:     row.schools?.id ?? undefined,
    schoolName:  row.schools?.name,
    schoolShortName:   row.schools?.short ?? row.schools?.name,
    color:       row.schools?.color ?? '#7C3AED',
    level,
    // Título del nivel: se lee del catálogo `levels` en BD (fuente de verdad)
    levelTitle:  row.teams?.levels?.title ?? 'Guardián',
  }
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user:          null,
  isHydrated:    false,
  isLoggingOut:  false,

  hydrate: async () => {
    // Si hay un cierre de sesión en curso, ignoramos getSession()
    // porque devolvería la sesión aún no invalidada (race condition).
    if (get().isLoggingOut) { set({ isHydrated: true }); return }
    if (isDemoMode) {
      set({ user: getStoredDemoUser(), isHydrated: true })
      return
    }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { set({ isHydrated: true }); return }
    const user = await fetchProfile(session.user.id)
    set({ user, isHydrated: true })
  },

  login: async (alias, pin) => {
    if (isDemoMode) {
      const user = demoLogin(alias, pin)
      if (!user) return 'invalid'
      set({ user })
      return 'ok'
    }

    const email = `${alias.trim().toLowerCase()}@guardianes.local`
    console.log('[login] intentando con:', email)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pin })
    console.log('[login] signInWithPassword →', { userId: data?.user?.id, error: error?.message })

    if (error || !data.user) return 'invalid'

    const user = await fetchProfile(data.user.id)
    console.log('[login] fetchProfile →', user)

    if (!user) return 'invalid'
    set({ user })
    return 'ok'
  },

  logout: async () => {
    // Marcamos el cierre como en curso para que hydrate() (que puede ser
    // llamado por la página /login antes de que signOut() termine) no
    // re-pueble el store con una sesión que aún no se invalidó.
    set({ user: null, isLoggingOut: true })
    if (isDemoMode) {
      clearStoredDemoUser()
      set({ isLoggingOut: false })
      return
    }
    await supabase.auth.signOut()
    set({ isLoggingOut: false })
  },
}))

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
