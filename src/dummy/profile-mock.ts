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
}

const profiles: Record<string, StaffProfile> = {
  'marcus-thorne': {
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
  },
}

export function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

function deriveName(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function getProfile(slug: string): StaffProfile {
  if (profiles[slug]) return profiles[slug]

  const rosterMember = rosterMembers.find((m) => slugify(m.name) === slug)

  return {
    name: rosterMember?.name ?? deriveName(slug),
    slug,
    staffId: rosterMember?.id ?? `CHR-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    role: rosterMember?.role ?? 'Staff',
    status: 'Active Duty',
    lastSync: '2m ago',
    uptimeReliability: '99.5%',
    accessLevel: '03',
    authProtocols: ['MFA_ENABLED', 'PHYSICAL_KEY'],
    activities: [
      { terminal: 'Main Gate - Arrival', action: 'Biometric Entry', time: '08:12 AM' },
      { terminal: 'Main Gate - Departure', action: 'Previous Day Sign-out', time: 'Yesterday' },
    ],
    timestamp: '2026.06.22.15.16',
  }
}
