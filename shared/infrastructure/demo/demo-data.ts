import chaptersJson from '@/data/json/chapters.json'
import demoJson from '@/data/json/demo.json'
import missionsJson from '@/data/json/missions.json'
import schoolsJson from '@/data/json/schools.json'
import type { AuthUser, Role } from '@/modules/auth/infrastructure/stores/authStore'
import type { Chapter } from '@/modules/chapters/domain/entities/chapter'
import type { Mission, MissionQuestion } from '@/modules/missions/domain/entities/mission'
import type {
  LeaderTeamReview,
  PendingEvidence,
  ReviewTeam,
} from '@/modules/missions/infrastructure/repositories/mission-progress.repository'
import type { SchoolRanking } from '@/modules/schools/domain/entities/school'
import type {
  SchoolDetail,
  SchoolTeamDetail,
} from '@/modules/schools/infrastructure/repositories/schools.repository'
import type { StudentDashboard } from '@/modules/teams/infrastructure/repositories/student-dashboard.repository'
import type { Team } from '@/modules/teams/domain/entities/team'

type DemoUser = {
  id: string
  name: string
  username: string
  pin: string
  role: Role
  teamId?: number
  schoolId?: string
  schoolName?: string
  schoolShortName?: string
  color: string
  level?: number
  levelTitle?: string
}

type DemoTeam = {
  id: number
  name: string
  schoolId: string
  schoolName: string
  color: string
  level: number
  levelTitle: string
  points: number
  nextLevelPoints: number
  currentChapterId: string
  missionsCompleted: number
  missionsInReview: number
  leaderId: string
  members: { id: string; name: string; alias: string; isLeader: boolean }[]
  earnedFragments: string[]
}

type DemoEvidence = {
  id: string
  teamId: number
  missionId: string
  photo: string | null
  createdAt: string
}

type DemoFile = {
  arrivalRadiusM: number
  users: DemoUser[]
  teams: DemoTeam[]
  progressByTeam: Record<string, Record<string, string>>
  pendingEvidence: DemoEvidence[]
}

const demo = demoJson as DemoFile
const chapters = chaptersJson as Chapter[]
const missions = missionsJson as Mission[]
const schoolsData = schoolsJson as {
  ranking: {
    position: number
    name: string
    points: number
    teams: number
    missionsCompleted: number
  }[]
  schools: {
    id: string
    name: string
    director: string
    rankingPosition: number
    totalPoints: number
    missionsCompleted: number
    teams: {
      id: string
      name: string
      color: string
      level: number
      levelTitle: string
      points: number
      missionsCompleted: number
      missionsInReview: number
      leader: string
      members: string[]
    }[]
  }[]
}

const STORAGE_KEY = 'guardianes-demo-user'

function cleanAlias(value: string): string {
  return value.trim().toLowerCase()
}

function toAuthUser(user: DemoUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    teamId: user.teamId,
    schoolId: user.schoolId,
    schoolName: user.schoolName,
    schoolShortName: user.schoolShortName,
    color: user.color,
    level: user.level,
    levelTitle: user.levelTitle,
  }
}

function getTeamOrFallback(teamId: number): DemoTeam {
  return demo.teams.find((team) => team.id === teamId) ?? demo.teams[0]
}

function missionById(missionId: string): Mission | undefined {
  return missions.find((mission) => mission.id === missionId)
}

export function demoLogin(alias: string, pin: string): AuthUser | null {
  const user = demo.users.find(
    (item) => cleanAlias(item.username) === cleanAlias(alias) && item.pin === pin,
  )
  if (!user) return null
  const authUser = toAuthUser(user)
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
  }
  return authUser
}

export function getStoredDemoUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function clearStoredDemoUser(): void {
  if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY)
}

export function getDemoChapters(): Chapter[] {
  return chapters
}

export function getDemoMissions(): Mission[] {
  return missions
}

export function getDemoMissionById(id: string): Mission | null {
  return missions.find((mission) => mission.id === id) ?? null
}

export function getDemoTeam(teamId: number): Team | null {
  const team = demo.teams.find((item) => item.id === teamId)
  if (!team) return null
  return {
    id: team.id,
    name: team.name,
    points: team.points,
    level: team.level,
    nextLevelPoints: team.nextLevelPoints,
    currentChapterId: team.currentChapterId,
    missionsCompleted: team.missionsCompleted,
  }
}

export function getDemoTeamProgress(teamId: number): Record<string, string> {
  return { ...(demo.progressByTeam[String(teamId)] ?? {}) }
}

export function getDemoAssignedQuestion(teamId: number, missionId: string): MissionQuestion | null {
  const mission = missionById(missionId)
  if (!mission || mission.type !== 'trivia') return null
  return {
    id: `demo-question-${teamId}-${missionId}`,
    missionId,
    question: mission.question,
    options: mission.options,
    correctAnswer: mission.correctAnswer,
  }
}

export function getDemoSchoolRanking(): SchoolRanking[] {
  return schoolsData.ranking.map((school) => {
    const detail = schoolsData.schools.find((item) => item.name === school.name)
    return {
      id: detail?.id ?? `school-${school.position}`,
      name: school.name,
      short: school.name.replace(/^Colegio\s|^I\.E\.\s/, ''),
      color: detail?.teams[0]?.color ?? '#7C3AED',
      points: school.points,
      missionsCompleted: school.missionsCompleted,
      totalTeams: school.teams,
      rankingPosition: school.position,
    }
  })
}

function numericTeamId(schoolIndex: number, teamIndex: number): number {
  return (schoolIndex + 1) * 100 + teamIndex + 1
}

export function getDemoSchoolsDetail(): SchoolDetail[] {
  return schoolsData.schools.map((school, schoolIndex) => ({
    id: school.id,
    name: school.name,
    director: school.director,
    color: school.teams[0]?.color ?? '#7C3AED',
    rankingPosition: school.rankingPosition,
    totalPoints: school.totalPoints,
    missionsCompleted: school.missionsCompleted,
    teams: school.teams.map<SchoolTeamDetail>((team, teamIndex) => ({
      id: numericTeamId(schoolIndex, teamIndex),
      name: team.name,
      color: team.color,
      level: team.level,
      levelTitle: team.levelTitle,
      points: team.points,
      missionsCompleted: team.missionsCompleted,
      missionsInReview: team.missionsInReview,
      leader: team.leader,
      members: team.members.map((name, memberIndex) => ({
        id: `demo-school-${schoolIndex + 1}-team-${teamIndex + 1}-member-${memberIndex + 1}`,
        name,
      })),
    })),
  }))
}

export function getDemoStudentDashboard(teamId: number): StudentDashboard {
  const team = getTeamOrFallback(teamId)
  const progress = getDemoTeamProgress(team.id)
  const chapterCards = chapters.map((chapter) => {
    const chapterMissions = missions.filter((mission) => mission.chapterId === chapter.id)
    const chapterStatuses = chapterMissions.map((mission) => progress[mission.id])
    return {
      id: chapter.id,
      number: chapter.number,
      title: chapter.title,
      color: chapter.color,
      fragmentId: chapter.fragment.id,
      fragmentName: chapter.fragment.name,
      fragmentIcon: chapter.fragment.icon,
      total: chapterMissions.length || chapter.totalMissions,
      completed: chapterStatuses.filter((status) => status === 'completed').length,
      review: chapterStatuses.filter((status) => status === 'review').length,
      locked: team.level < chapter.requiredLevel,
    }
  })
  const totalCompleted = Object.values(progress).filter((status) => status === 'completed').length
  const totalReview = Object.values(progress).filter((status) => status === 'review').length
  const totalMissions = chapterCards.reduce((sum, chapter) => sum + chapter.total, 0)

  return {
    teamName: team.name,
    members: team.members,
    level: team.level,
    points: team.points,
    levelTitle: team.levelTitle,
    nextLevelPoints: team.nextLevelPoints,
    earnedFragments: team.earnedFragments,
    chapters: chapterCards,
    totalCompleted,
    totalReview,
    totalMissions,
    totalPending: Math.max(0, totalMissions - totalCompleted - totalReview),
    totalSchools: schoolsData.ranking.length,
  }
}

function toReviewTeam(team: DemoTeam): ReviewTeam {
  return {
    teamId: team.id,
    teamName: team.name,
    level: team.level,
    points: team.points,
    color: team.color,
    schoolName: team.schoolName,
    members: team.members
      .filter((member) => !member.isLeader)
      .map((member) => ({ id: member.id, name: member.name, alias: member.alias })),
  }
}

function toPendingEvidence(evidence: DemoEvidence): PendingEvidence {
  const mission = missionById(evidence.missionId)
  return {
    id: evidence.id,
    photo: evidence.photo,
    createdAt: evidence.createdAt,
    missionTitle: mission?.location ?? 'Mision demo',
    missionPoints: mission?.points ?? null,
    missionType: mission?.type ?? null,
  }
}

export function getDemoLeaderReviewData(leaderId: string): LeaderTeamReview[] {
  return demo.teams
    .filter((team) => team.leaderId === leaderId)
    .map((team) => ({
      team: toReviewTeam(team),
      pending: demo.pendingEvidence
        .filter((evidence) => evidence.teamId === team.id)
        .map(toPendingEvidence),
      approvedCount: Object.values(getDemoTeamProgress(team.id)).filter(
        (status) => status === 'completed',
      ).length,
    }))
}

export function getDemoArrivalRadius(): number {
  return demo.arrivalRadiusM
}
