import { create } from 'zustand'
import { supabase } from '@/shared/infrastructure/supabase/client'

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
  hydrate: () => Promise<void>
  login: (alias: string, pin: string) => Promise<'ok' | 'invalid'>
  logout: () => Promise<void>
}

const LEVEL_TITLES: Record<number, string> = {
  1: 'Iniciado',
  2: 'Explorador Histórico',
  3: 'Guardián Novato',
  4: 'Guardián Valiente',
  5: 'Guardián Maestro',
}

interface UsuarioRow {
  alias: string
  nombre: string
  apellidos: string | null
  team_id: number | null
  roles: { type: string } | null
  schools: { id:string,  name: string; short: string; color: string | null } | null
  teams: { level: number | null } | null
}

async function fetchProfile(userId: string): Promise<AuthUser | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('usuarios')
    .select('alias, nombre, apellidos, team_id, roles ( type ), schools ( id, name, short, color ), teams!usuarios_team_id_fkey ( level )')
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
    levelTitle:  LEVEL_TITLES[level] ?? 'Guardián',
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  user:        null,
  isHydrated:  false,

  hydrate: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { set({ isHydrated: true }); return }
    const user = await fetchProfile(session.user.id)
    set({ user, isHydrated: true })
  },

  login: async (alias, pin) => {
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
    // Limpiamos el estado primero (síncrono) para que cualquier redirect a
    // /login vea user=null de inmediato y no rebote de vuelta al mapa.
    set({ user: null })
    await supabase.auth.signOut()
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
