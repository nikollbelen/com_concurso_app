// Script de seed para crear usuarios en Supabase Auth correctamente.
// Uso: node scripts/seed-users.mjs
// Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Leer .env.local manualmente
const envFile = readFileSync('.env.local', 'utf8')
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(line => line.includes('=') && !line.startsWith('#'))
    .map(line => {
      const [key, ...rest] = line.split('=')
      return [key.trim(), rest.join('=').trim()]
    })
)

const supabaseUrl  = env['NEXT_PUBLIC_SUPABASE_URL']
const serviceKey   = env['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl || !serviceKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ── Datos fijos de roles y colegios (deben ya existir en la BD) ──────────────

const ROLES = {
  student:  '11111111-1111-1111-1111-111111111111',
  leader:   '22222222-2222-2222-2222-222222222222',
  director: '33333333-3333-3333-3333-333333333333',
  admin:    '44444444-4444-4444-4444-444444444444',
}

const SCHOOLS = {
  independencia: 'aaaa0000-0000-0000-0000-000000000001',
  san_francisco: 'aaaa0000-0000-0000-0000-000000000002',
}

// ── Lista de usuarios a crear ────────────────────────────────────────────────
// Edita esta lista con los datos reales cuando te llegue el Excel

const USUARIOS = [
  {
    alias:     'lcondor',
    nombre:    'Lucas',
    apellidos: 'Cóndor',
    pin:       'alumno123',
    role:      'student',
    school:    'independencia',
    team_id:   1,
  },
  {
    alias:     'cmamani',
    nombre:    'Carlos',
    apellidos: 'Mamani',
    pin:       'alumno123',
    role:      'student',
    school:    'independencia',
    team_id:   1,
  },
  {
    alias:     'mquispe',
    nombre:    'María',
    apellidos: 'Quispe',
    pin:       'docente123',
    role:      'leader',
    school:    'independencia',
    team_id:   1,
  },
  {
    alias:     'rflores',
    nombre:    'Roberto',
    apellidos: 'Flores',
    pin:       'director123',
    role:      'director',
    school:    'independencia',
    team_id:   null,
  },
  {
    alias:     'asistem',
    nombre:    'Admin',
    apellidos: 'Sistema',
    pin:       'admin2024',
    role:      'admin',
    school:    null,
    team_id:   null,
  },
]

// ── Lógica principal ─────────────────────────────────────────────────────────

async function crearUsuario(u) {
  const email = `${u.alias}@guardianes.local`

  // 1. Crear en Auth (GoTrue lo hace bien, con todos los campos internos)
  let { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password:      u.pin,
    email_confirm: true,   // confirmado de inmediato, sin email de verificación
  })

  if (authError) {
    if (authError.message?.includes('already been registered')) {
      console.log(`  ⚠ ${u.alias} ya existe en Auth, actualizando perfil...`)
      // Obtener el UUID del usuario existente
      const { data: list } = await supabase.auth.admin.listUsers()
      const existing = list?.users?.find(usr => usr.email === email)
      if (!existing) { console.error(`  ✗ No se encontró ${email}`); return }
      authData = { user: existing }
    } else {
      console.error(`  ✗ Error creando ${u.alias}:`, authError.message)
      return
    }
  }

  const userId = authData.user.id

  // 2. Actualizar el perfil en public.usuarios (el trigger ya creó la fila base)
  const { error: profileError } = await supabase
    .from('usuarios')
    .upsert({
      id:        userId,
      alias:     u.alias,
      nombre:    u.nombre,
      apellidos: u.apellidos,
      role_id:   ROLES[u.role],
      school_id: u.school ? SCHOOLS[u.school] : null,
      team_id:   u.team_id,
    }, { onConflict: 'id' })

  if (profileError) {
    console.error(`  ✗ Error actualizando perfil de ${u.alias}:`, profileError.message)
    return
  }

  console.log(`  ✓ ${u.alias} (${u.role}) creado correctamente`)
}

async function main() {
  console.log('Iniciando seed de usuarios...\n')

  // Primero eliminar usuarios existentes con @guardianes.local para empezar limpio
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const guardianesUsers = existingUsers?.users?.filter(u => u.email?.endsWith('@guardianes.local')) ?? []

  if (guardianesUsers.length > 0) {
    console.log(`Eliminando ${guardianesUsers.length} usuarios previos...`)
    for (const u of guardianesUsers) {
      await supabase.auth.admin.deleteUser(u.id)
    }
    console.log('Usuarios eliminados.\n')
  }

  for (const usuario of USUARIOS) {
    process.stdout.write(`Creando ${usuario.alias}... `)
    await crearUsuario(usuario)
  }

  console.log('\nSeed completado.')
}

main().catch(console.error)
