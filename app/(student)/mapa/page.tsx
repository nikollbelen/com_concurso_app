'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Map, { Marker, type MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

import { GameHeader }         from '@/shared/ui/components/GameHeader'
import { GpsBanner }          from '@/shared/ui/components/GpsBanner'
import { FabButton }          from '@/shared/ui/components/FabButton'
import { DirectorBottomSheet} from '@/shared/ui/components/DirectorBottomSheet'
import { AdminBottomSheet } from '@/shared/ui/components/AdminBottomSheet'
import { MissionMarker }      from '@/modules/missions/presentation/components/MissionMarker'
import {
  MissionBottomSheet,
  type SelectedMission,
  type Chapter as BottomSheetChapter,
} from '@/modules/missions/presentation/components/MissionBottomSheet'
import {
  LeaderBottomSheet,
  type PendingMission,
} from '@/modules/missions/presentation/components/LeaderBottomSheet'
import { useAuthStore, ROLE_PANEL } from '@/modules/auth/infrastructure/stores/authStore'
import { LogoutModal }              from '@/shared/ui/components/LogoutModal'

import chaptersRaw from '@/data/json/chapters.json'
import missionsRaw from '@/data/json/missions.json'
import teamDataRaw from '@/data/json/teams.json'
import schoolsRaw  from '@/data/json/schools.json'

import Image from 'next/image'
import { Trophy, Navigation, LogIn, LogOut, LayoutDashboard } from 'lucide-react'

/* ── types ────────────────────────────────────────────────── */

type MissionStatus = 'available' | 'completed' | 'review' | 'locked'
type MissionType   = 'trivia' | 'photo' | 'creative'

interface Mission {
  id: string; chapterId: string; location: string
  coordinates: [number, number]; type: MissionType
  points: number; question: string; options: string[]; correctAnswer: number
}
interface Chapter {
  id: string; number: number; title: string; subtitle: string
  fragment: { id: string; name: string; icon: string }
  requiredLevel: number; color: string; totalMissions: number
}
interface TeamData {
  currentTeam: {
    id: string; name: string; schoolName: string
    level: number; levelTitle: string; points: number
    nextLevelPoints: number; currentChapterId: string; color: string
  }
  missionProgress: Record<string, string>
  unlockedChapters: string[]
  earnedFragments: string[]
}
interface SchoolsData {
  schoolStats: Record<string, {
    rankingPosition: number
    totalTeams: number
    activeTeams: number
    totalMissionsCompleted: number
    totalPoints: number
  }>
  eventStats: { totalSchools: number; totalTeams: number; totalMissionsCompleted: number }
}
interface UserPosition { lng: number; lat: number; heading: number | null }

/* ── constants ────────────────────────────────────────────── */

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''
const AREQUIPA_LNG = -71.5369
const AREQUIPA_LAT = -16.3989
const INITIAL_ZOOM = 14

const chapters  = chaptersRaw as Chapter[]
const missions  = missionsRaw as Mission[]
const teamData  = teamDataRaw as TeamData
const schoolsData = schoolsRaw as SchoolsData

/* ── helpers ──────────────────────────────────────────────── */

function getMissionStatus(
  missionId: string, chapterId: string,
  unlockedChapters: string[], progress: Record<string, string>,
): MissionStatus {
  if (!unlockedChapters.includes(chapterId)) return 'locked'
  const p = progress[missionId]
  if (p === 'completed') return 'completed'
  if (p === 'review')    return 'review'
  return 'available'
}

/* ── Sub-components ───────────────────────────────────────── */

function UserDot({ position }: { position: UserPosition }) {
  return (
    <Marker longitude={position.lng} latitude={position.lat} anchor="center">
      <div className="relative flex items-center justify-center">
        <div className="absolute rounded-full" style={{ width: 52, height: 52, background: 'rgba(0,168,255,0.18)', border: '2px solid rgba(0,240,255,0.5)', animation: 'pulse-ring 2s ease-out infinite' }} />
        <div className="absolute rounded-full" style={{ width: 36, height: 36, background: 'rgba(0,168,255,0.15)', animation: 'neon-pulse 2s ease-in-out infinite' }} />
        <div className="relative w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(to bottom, #00f0ff, #00a8ff)', border: '4px solid #fff', boxShadow: '0 0 20px rgba(0,240,255,0.8), 0 4px 12px rgba(0,0,0,0.5)' }}>
          <Navigation className="w-6 h-6 text-white drop-shadow-md" fill="white" />
        </div>
      </div>
    </Marker>
  )
}

/* ── No-token guard ───────────────────────────────────────── */

function NoTokenScreen() {
  return (
    <div className="h-dvh flex flex-col items-center justify-center gap-4 p-8 text-center" style={{ background: '#0d1117' }}>
      <Image src="/images/logo_principal.png" alt="Guardianes de Arequipa" width={100} height={100} className="object-contain opacity-60" style={{ width: 100, height: 'auto' }} />
      <p className="font-bold text-lg" style={{ fontFamily: 'var(--font-cinzel), serif', color: '#00f0ff' }}>Falta el token de Mapbox</p>
      <p className="text-sm max-w-xs" style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.4)' }}>
        Crea <code style={{ color: '#ff9500' }}>.env.local</code> y añade{' '}
        <code style={{ color: '#ff9500' }}>NEXT_PUBLIC_MAPBOX_TOKEN=tu_token</code>
      </p>
    </div>
  )
}

/* ── Loading screen ───────────────────────────────────────── */

function LoadingScreen() {
  return (
    <div className="h-dvh flex items-center justify-center" style={{ background: '#0d1117' }}>
      <div className="flex flex-col items-center gap-4">
        <div style={{ filter: 'drop-shadow(0 0 24px rgba(0,168,255,0.5))', animation: 'neon-pulse 1.5s ease-in-out infinite' }}>
          <Image src="/images/logo_principal.png" alt="Guardianes de Arequipa" width={90} height={90} priority loading="eager" className="object-contain" style={{ width: 90, height: 'auto' }} />
        </div>
        <p className="text-sm uppercase tracking-widest" style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.3)' }}>
          Cargando...
        </p>
      </div>
    </div>
  )
}

/* ── Public map (not logged in) ───────────────────────────── */

function PublicMapView({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="relative h-dvh w-full overflow-hidden" style={{ background: '#0d1117' }}>
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: AREQUIPA_LNG, latitude: AREQUIPA_LAT, zoom: INITIAL_ZOOM }}
        style={{ position: 'fixed', inset: 0 }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        attributionControl={false}
        scrollZoom={false}
        dragPan={false}
        touchZoomRotate={false}
      />

      <div className="fixed inset-0 z-10" style={{ background: 'rgba(13,17,23,0.55)', backdropFilter: 'blur(3px)' }} />

      <div className="fixed inset-0 z-20 flex items-center justify-center p-6">
        <div className="glass-panel hud-scanline rounded-3xl p-8 text-center w-full max-w-xs"
          style={{ border: '1px solid rgba(0,240,255,0.25)', boxShadow: '0 8px 40px rgba(0,0,0,0.6), inset 0 0 30px rgba(0,240,255,0.04)' }}>

          <div className="flex justify-center mb-4" style={{ filter: 'drop-shadow(0 0 20px rgba(0,168,255,0.4))' }}>
            <Image src="/images/logo_principal.png" alt="Guardianes de Arequipa" width={130} height={130} loading="eager" className="object-contain" style={{ width: 130, height: 'auto' }} />
          </div>

          <p className="text-sm mb-6" style={{ fontFamily: 'var(--font-exo2), sans-serif', color: 'rgba(255,255,255,0.4)' }}>
            Inicia sesión para ver las misiones y competir con tu equipo
          </p>

          <button
            onClick={onLogin}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest text-white transition-all active:scale-[0.98] active:translate-y-0.5"
            style={{
              fontFamily: 'var(--font-exo2), sans-serif',
              background: 'linear-gradient(to bottom,#00d2ff,#00a8ff)',
              boxShadow: '0 6px 0 rgba(0,0,0,0.25), inset 0 -3px 0 rgba(0,0,0,0.15), inset 0 3px 0 rgba(255,255,255,0.25), 0 0 20px rgba(0,168,255,0.4)',
              border: '1.5px solid rgba(255,255,255,0.25)',
            }}
          >
            <LogIn className="w-4 h-4" />
            Iniciar Sesión
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────── */

export default function MapaPage() {
  const router = useRouter()
  const { user, isHydrated, hydrate, logout } = useAuthStore()

  const [gpsStatus,      setGpsStatus]      = useState<'unknown' | 'denied' | 'granted'>('unknown')
  const [userPos,        setUserPos]        = useState<UserPosition | null>(null)
  const [selectedId,     setSelectedId]     = useState<string | null>(null)
  const [confirmLogout,  setConfirmLogout]  = useState(false)

  const mapRef     = useRef<MapRef>(null)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => { hydrate() }, [hydrate])

  useEffect(() => {
    if (!user) return

    function startWatch() {
      if (watchIdRef.current !== null) return
      watchIdRef.current = navigator.geolocation.watchPosition(
        pos => {
          setGpsStatus('granted')
          setUserPos({ lng: pos.coords.longitude, lat: pos.coords.latitude, heading: pos.coords.heading })
        },
        () => setGpsStatus('denied'),
        { enableHighAccuracy: true, maximumAge: 5000 },
      )
    }

    navigator.permissions?.query({ name: 'geolocation' })
      .then(result => {
        if (result.state === 'granted') { setGpsStatus('granted'); startWatch() }
        else if (result.state === 'denied') setGpsStatus('denied')
        result.onchange = () => {
          if (result.state === 'granted') { setGpsStatus('granted'); startWatch() }
          else setGpsStatus('denied')
        }
      })
      .catch(() => setGpsStatus('unknown'))

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [user])

  /* ─ derived data ─ */
  const { currentTeam, missionProgress, unlockedChapters, earnedFragments } = teamData
  const activeChapter  = chapters.find(c => c.id === currentTeam.currentChapterId) ?? chapters[0]
  const activeMissions = missions.filter(m => m.chapterId === activeChapter.id)

  const selectedMission: SelectedMission | null = selectedId
    ? (() => {
        const m = missions.find(x => x.id === selectedId)
        if (!m) return null
        return { id: m.id, location: m.location, type: m.type, points: m.points, question: m.question,
          status: getMissionStatus(m.id, m.chapterId, unlockedChapters, missionProgress) }
      })()
    : null

  const completedCount = activeMissions.filter(m => missionProgress[m.id] === 'completed').length
  const reviewCount    = activeMissions.filter(m => missionProgress[m.id] === 'review').length
  const hasFragment    = earnedFragments.includes(activeChapter.fragment.id)

  /* ─ leader: pending review missions ─ */
  const pendingMissions: PendingMission[] = missions
    .filter(m => missionProgress[m.id] === 'review')
    .map(m => ({ id: m.id, location: m.location, type: m.type, points: m.points }))

  /* ─ director / admin: school stats ─ */
  const mySchoolStats = user?.schoolName
    ? (schoolsData.schoolStats[user.schoolName] ?? null)
    : null

  /* ─ handlers ─ */
  const handleActivateGps = useCallback(() => {
    navigator.geolocation.getCurrentPosition(() => setGpsStatus('granted'), () => setGpsStatus('denied'))
  }, [])
  const handleCenterGps = useCallback(() => {
    if (userPos) mapRef.current?.easeTo({ center: [userPos.lng, userPos.lat], duration: 800 })
  }, [userPos])

  /* only students interact with markers */
  const handleMarkerClick = useCallback((id: string) => {
    if (user?.role !== 'student') return
    setSelectedId(prev => prev === id ? null : id)
  }, [user?.role])

  const handleCloseSheet   = useCallback(() => setSelectedId(null), [])
  const handleGoToMission  = useCallback((id: string) => router.push(`/mision/${id}`), [router])
  const handleConfirmLogout = useCallback(() => { logout(); router.replace('/login') }, [logout, router])
  const handleGoToPanel     = useCallback(() => { router.push(ROLE_PANEL[user?.role ?? 'student']) }, [router, user])

  /* ─ guards ─ */
  if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'pk.YOUR_MAPBOX_TOKEN_HERE') return <NoTokenScreen />
  if (!isHydrated) return <LoadingScreen />
  if (!user)       return <PublicMapView onLogin={() => router.push('/login')} />

  /* ─ bottom-sheet chapter (student only) ─ */
  const sheetChapter: BottomSheetChapter = {
    id: activeChapter.id, number: activeChapter.number, title: activeChapter.title,
    fragment: activeChapter.fragment, color: activeChapter.color, totalMissions: activeChapter.totalMissions,
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden" style={{ background: '#0d1117' }}>

      {/* ── Header (role-aware) ── */}
      {user.role === 'student'
        ? (
          <GameHeader
            role="student"
            team={{
              name:            user.name,
              color:           user.color,
              level:           currentTeam.level,
              levelTitle:      currentTeam.levelTitle,
              points:          currentTeam.points,
              nextLevelPoints: currentTeam.nextLevelPoints,
            }}
          />
        ) : (
          <GameHeader
            role={user.role}
            name={user.name}
            schoolName={user.schoolName}
            color={user.color}
          />
        )
      }

      {/* ── GPS banner ── */}
      {gpsStatus === 'denied' && <GpsBanner onActivate={handleActivateGps} />}

      {/* ── Map ── */}
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: AREQUIPA_LNG, latitude: AREQUIPA_LAT, zoom: INITIAL_ZOOM }}
        style={{ position: 'fixed', inset: 0 }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        attributionControl={false}
      >
        {userPos && <UserDot position={userPos} />}
        {activeMissions.map(m => (
          <MissionMarker key={m.id} id={m.id}
            longitude={m.coordinates[0]} latitude={m.coordinates[1]}
            status={getMissionStatus(m.id, m.chapterId, unlockedChapters, missionProgress)}
            type={m.type} onClick={handleMarkerClick}
          />
        ))}
      </Map>

      {/* ── Logo watermark ── */}
      <div className="fixed bottom-4 left-4 z-40 pointer-events-none select-none"
        style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))' }}>
        <Image src="/images/logo_principal.png" alt="" aria-hidden width={52} height={52} className="object-contain opacity-40" style={{ width: 52, height: 'auto' }} />
      </div>

      {/* ── FABs ── */}
      <div className="fixed right-5 z-50 flex flex-col items-end gap-3"
        style={{ bottom: 'max(104px, calc(env(safe-area-inset-bottom) + 104px))' }}>
        <FabButton variant="surface" size="md" label="Centrar en mi ubicación" onClick={handleCenterGps}>
          <Navigation className="w-5 h-5" />
        </FabButton>
        <FabButton variant="gold" size="lg" label="Ranking de Colegios" onClick={() => router.push('/ranking')}>
          <Trophy className="w-7 h-7" />
        </FabButton>
        <div className="relative shrink-0 group">
          <button
            onClick={handleGoToPanel}
            aria-label="Mi panel"
            className="w-14 h-14 rounded-full flex items-center justify-center font-black text-lg text-white transition-all duration-100 active:translate-y-1 active:scale-95 select-none overflow-hidden"
            style={{
              fontFamily: 'var(--font-exo2), sans-serif',
              background: `linear-gradient(135deg, ${user.color}dd, ${user.color})`,
              boxShadow: `0 6px 0 rgba(0,0,0,0.3), 0 0 20px ${user.color}55, inset 0 2px 0 rgba(255,255,255,0.25)`,
              border: '2.5px solid rgba(255,255,255,0.3)',
            }}
          >
            <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.22) 0%, transparent 55%)' }} />
            <LayoutDashboard className="relative z-10 w-5 h-5" />
          </button>
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-exo2), sans-serif', backdropFilter: 'blur(8px)' }}>
            Mi panel
          </div>
        </div>

        <FabButton variant="surface" size="md" label="Cerrar sesión" onClick={() => setConfirmLogout(true)}>
          <LogOut className="w-5 h-5" />
        </FabButton>
      </div>

      {/* ── Logout confirm modal ── */}
      <LogoutModal
        isOpen={confirmLogout}
        onConfirm={handleConfirmLogout}
        onCancel={() => setConfirmLogout(false)}
      />

      {/* ── Bottom sheet (role-aware) ── */}
      {user.role === 'student' && (
        <MissionBottomSheet
          chapter={sheetChapter}
          completedCount={completedCount}
          reviewCount={reviewCount}
          selectedMission={selectedMission}
          hasFragment={hasFragment}
          onGoToMission={handleGoToMission}
          onClose={handleCloseSheet}
        />
      )}
      {user.role === 'leader' && (
        <LeaderBottomSheet
          pendingMissions={pendingMissions}
          teamName={currentTeam.name}
        />
      )}
      {user.role === 'director' && mySchoolStats && (
        <DirectorBottomSheet
          schoolName={user.schoolName ?? ''}
          rankingPosition={mySchoolStats.rankingPosition}
          totalTeams={mySchoolStats.totalTeams}
          missionsCompleted={mySchoolStats.totalMissionsCompleted}
          totalPoints={mySchoolStats.totalPoints}
        />
      )}
      {user.role === 'admin' && (
        <AdminBottomSheet />
      )}
    </div>
  )
}
