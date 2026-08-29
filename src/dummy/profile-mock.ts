import { rosterMembers } from './roster-mock'

export interface ScanActivity {
  terminal: string
  action: string
  time: string
}

export interface StaffProfile {
  name: string
  slug: string
  staffId: string
  role: string
  status: string
  lastSync: string
  uptimeReliability: string
  accessLevel: string
  authProtocols: string[]
  activities: ScanActivity[]
  timestamp: string
  avatarUrl?: string
  email?: string
  isBiometricEnrolled?: boolean
}

const profiles: Record<string, StaffProfile> = {
  'ID-9420': {
    name: 'Marcus Thorne',
    slug: 'marcus-thorne',
    staffId: 'ID-9420',
    role: 'Lead Administrator',
    status: 'Active Duty',
    lastSync: '4m ago',
    uptimeReliability: '99.98%',
    accessLevel: '05',
    authProtocols: ['BIOMETRIC_OVERRIDE', 'MFA_ENABLED', 'PHYSICAL_KEY'],
    activities: [
      { terminal: 'Terminal 04 - East Wing', action: 'Manual Entrance Approval', time: '12:45 PM' },
      { terminal: 'Server Room B', action: 'Routine Hardware Check', time: '10:12 AM' },
      { terminal: 'Boardroom North', action: 'Meeting Authentication', time: '09:30 AM' },
      { terminal: 'Main Gate - Arrival', action: 'Encrypted Key Exchange', time: '08:05 AM' },
      { terminal: 'Main Gate - Departure', action: 'Previous Day Sign-out', time: 'Yesterday' },
    ],
    timestamp: '2026.06.22.15.16',
    isBiometricEnrolled: true,
  },
}

export function slugify(name: string): string {
  return (name || '').toLowerCase().replace(/\s+/g, '-')
}

function deriveName(slug: string): string {
  if (!slug || slug.includes('-') && slug.length > 20) {
    return 'Team Member'
  }
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function getProfile(
  identifier: string,
  currentUser?: { id?: string; name?: string; email?: string; avatarUrl?: string }
): StaffProfile {
  const cleanId = (identifier || '').trim()

  // Match current authenticated user
  const isCurrentUser =
    Boolean(currentUser?.name) &&
    ((currentUser?.id && cleanId.toLowerCase().includes(currentUser.id.toLowerCase())) ||
      (currentUser?.id && cleanId.toLowerCase() === `wm_${currentUser.id.replace(/-/g, '').slice(0, 12).toLowerCase()}`) ||
      (currentUser?.id && cleanId.toLowerCase() === `chr-${currentUser.id.replace(/-/g, '').slice(0, 4).toLowerCase()}`) ||
      cleanId === 'CHR-0001' ||
      cleanId === 'wm_usr_current' ||
      cleanId === 'me' ||
      (currentUser?.name && slugify(currentUser.name) === cleanId.toLowerCase()))

  if (isCurrentUser && currentUser?.name) {
    return {
      name: currentUser.name,
      slug: slugify(currentUser.name),
      staffId: cleanId || (currentUser.id ? `CHR-${currentUser.id.replace(/-/g, '').slice(0, 4).toUpperCase()}` : 'CHR-0001'),
      role: 'Administrator',
      status: 'Active Duty',
      lastSync: 'Just now',
      uptimeReliability: '100%',
      accessLevel: '05',
      authProtocols: ['BIOMETRIC_OVERRIDE', 'MFA_ENABLED', 'PHYSICAL_KEY'],
      activities: [
        { terminal: 'Main Gate - Arrival', action: 'Biometric Authenticated', time: '08:00 AM' },
        { terminal: 'Terminal 04 - East Wing', action: 'Workspace Synchronized', time: 'Just now' },
      ],
      timestamp: '2026.06.22.15.16',
      avatarUrl: currentUser.avatarUrl,
      email: currentUser.email,
      isBiometricEnrolled: false,
    }
  }

  // Match existing static profiles by ID or slug
  if (profiles[cleanId]) return profiles[cleanId]
  const matchedProfile = Object.values(profiles).find(
    (p) => p.staffId.toLowerCase() === cleanId.toLowerCase() || p.slug === cleanId
  )
  if (matchedProfile) return matchedProfile

  // Match roster mock members by ID or slug
  const rosterMember = rosterMembers.find(
    (m) => m.id.toLowerCase() === cleanId.toLowerCase() || slugify(m.name) === cleanId.toLowerCase()
  )

  const resolvedName = rosterMember?.name ?? (currentUser?.name || deriveName(cleanId))

  return {
    name: resolvedName,
    slug: slugify(resolvedName),
    staffId: rosterMember?.id ?? cleanId,
    role: rosterMember?.role ?? 'Staff',
    status: rosterMember?.status === 'On-Site' ? 'Active Duty' : 'Off-Site',
    lastSync: '2m ago',
    uptimeReliability: '99.5%',
    accessLevel: rosterMember?.role === 'Administrator' ? '05' : '03',
    authProtocols: ['MFA_ENABLED', 'PHYSICAL_KEY'],
    activities: [
      { terminal: 'Main Gate - Arrival', action: 'Biometric Entry', time: '08:12 AM' },
      { terminal: 'Main Gate - Departure', action: 'Previous Day Sign-out', time: 'Yesterday' },
    ],
    timestamp: '2026.06.22.15.16',
    email: rosterMember?.email || currentUser?.email,
    isBiometricEnrolled: false,
  }
}
