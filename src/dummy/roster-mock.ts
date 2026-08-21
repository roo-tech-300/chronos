export interface RosterMember {
  id: string
  name: string
  email: string
  role: string
  status: 'On-Site' | 'Off-Site'
}

export const rosterMembers: RosterMember[] = [
  { id: 'CHR-9421', name: 'Elena Rodriguez', email: 'e.rodriguez@chronos.io', role: 'Administrator', status: 'On-Site' },
  { id: 'CHR-8832', name: 'Marcus Chen', email: 'm.chen@chronos.io', role: 'Staff', status: 'Off-Site' },
  { id: 'CHR-7654', name: 'Sarah Jenkins', email: 's.jenkins@chronos.io', role: 'Editor', status: 'On-Site' },
  { id: 'CHR-5510', name: 'David Vance', email: 'd.vance@chronos.io', role: 'Staff', status: 'On-Site' },
  { id: 'CHR-4423', name: 'Lisa Park', email: 'l.park@chronos.io', role: 'Editor', status: 'On-Site' },
  { id: 'CHR-3398', name: 'James Okonkwo', email: 'j.okonkwo@chronos.io', role: 'Administrator', status: 'Off-Site' },
  { id: 'CHR-2281', name: 'Priya Sharma', email: 'p.sharma@chronos.io', role: 'Staff', status: 'On-Site' },
  { id: 'CHR-1176', name: 'Tom Birkeland', email: 't.birkeland@chronos.io', role: 'Staff', status: 'Off-Site' },
]

export const roleOptions = ['Senior Security Admin', 'Systems Editor', 'Logistics Officer', 'Field Technician', 'Standard Staff'] as const

export const filterTabs = ['All Roles', 'Administrators', 'Editors', 'Staff'] as const

export function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('')
}
