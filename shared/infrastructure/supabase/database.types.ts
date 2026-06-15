export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      chapters: {
        Row: {
          id: string
          title: string
          number: number
          fragment: string | null
          created_at: string
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['chapters']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['chapters']['Insert']>
      }
      missions: {
        Row: {
          id: string
          id_chapter: string | null
          marker_image: string | null
          points: number | null
          created_at: string
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['missions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['missions']['Insert']>
      }
      mission_progression: {
        Row: {
          id: string
          team_id: number
          mission_id: string
          photo: string | null
          status: boolean
          fecha: string | null
          created_at: string
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['mission_progression']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['mission_progression']['Insert']>
      }
      roles: {
        Row: {
          id: string
          type: string
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['roles']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['roles']['Insert']>
      }
      schools: {
        Row: {
          id: string
          name: string
          color: string | null
          points: number
          created_at: string
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['schools']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['schools']['Insert']>
      }
      teams: {
        Row: {
          id: number
          name: string
          leader_id: string
          school_id: string
          points: number | null
          level: number | null
          created_at: string
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['teams']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['teams']['Insert']>
      }
      usuarios: {
        Row: {
          id: string
          alias: string
          nombre: string
          apellidos: string | null
          role_id: string | null
          school_id: string | null
          team_id: number | null
          created_at: string
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['usuarios']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['usuarios']['Insert']>
      }
      insignia: {
        Row: {
          id: string
          name: string
          description: string
          image: string | null
          created_at: string
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['insignia']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['insignia']['Insert']>
      }
      team_insignia: {
        Row: {
          team_id: number
          insignia_id: string
          created_at: string
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['team_insignia']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['team_insignia']['Insert']>
      }
    }
  }
}

/** Claims inyectados por custom_access_token_hook en cada JWT de Supabase Auth */
export interface SupabaseJwtClaims {
  sub: string       // user id (auth.users.id)
  role_id: string   // UUID del rol (tabla roles)
  team_id: number   // ID del equipo (tabla teams)
  email?: string
  aud: string
  exp: number
}
