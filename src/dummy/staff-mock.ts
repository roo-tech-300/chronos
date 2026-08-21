export interface StaffMember {
  name: string
  initials: string
  time: string
  terminal: string
}

export interface Metric {
  label: string
  value: string
  badge: string
  badgeVariant: 'primary' | 'green'
  description: string
}

export const metrics: Metric[] = [
  { label: 'Total Staff', value: '14,282', badge: '+12%', badgeVariant: 'primary', description: 'Verified biological profiles' },
  { label: 'Online Devices', value: '342', badge: 'Optimal', badgeVariant: 'green', description: 'Global node distribution' },
  { label: 'Today\'s Scans', value: '89.4k', badge: 'New High', badgeVariant: 'primary', description: 'Last 24h biometric events' },
]

export const chartHeights: number[] = [40, 55, 35, 70, 85, 45, 60, 50, 95, 40, 30, 55]
export const chartLabels: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const headcountMembers: StaffMember[] = [
  { name: 'Julian Vance', initials: 'JV', time: '12:44 PM', terminal: 'Main Entry — Terminal #12' },
  { name: 'Elena Rossi', initials: 'ER', time: '12:43 PM', terminal: 'R&D Lab — Terminal #44' },
  { name: 'Dr. Aris Thorne', initials: 'AT', time: '12:41 PM', terminal: 'Server Room B — Terminal #01' },
  { name: 'Sarah Jenkins', initials: 'SJ', time: '12:38 PM', terminal: 'Parking Level 1 — Terminal #22' },
  { name: 'Mark Thompson', initials: 'MT', time: '12:35 PM', terminal: 'Exit East — Terminal #15' },
]
