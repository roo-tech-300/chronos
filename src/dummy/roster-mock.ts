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
  { id: 'CHR-9912', name: 'Julian Sterling', email: 'j.sterling@chronos.io', role: 'Administrator', status: 'On-Site' },
  { id: 'CHR-9844', name: 'Kavita Patel', email: 'k.patel@chronos.io', role: 'Staff', status: 'On-Site' },
  { id: 'CHR-9720', name: 'Aria Thorne', email: 'a.thorne@chronos.io', role: 'Staff', status: 'Off-Site' },
  { id: 'CHR-9615', name: 'Lucas Vance', email: 'l.vance@chronos.io', role: 'Editor', status: 'On-Site' },
  { id: 'CHR-9501', name: 'Amara Okafor', email: 'a.okafor@chronos.io', role: 'Administrator', status: 'On-Site' },
  { id: 'CHR-9433', name: 'Soren Lindqvist', email: 's.lindqvist@chronos.io', role: 'Staff', status: 'Off-Site' },
  { id: 'CHR-9321', name: 'Zara Nkosi', email: 'z.nkosi@chronos.io', role: 'Staff', status: 'On-Site' },
  { id: 'CHR-9218', name: 'Mateo Morales', email: 'm.morales@chronos.io', role: 'Editor', status: 'Off-Site' },
  { id: 'CHR-9110', name: 'Hannah Abbott', email: 'h.abbott@chronos.io', role: 'Staff', status: 'On-Site' },
  { id: 'CHR-9005', name: 'Dmitri Volkov', email: 'd.volkov@chronos.io', role: 'Administrator', status: 'On-Site' },
  { id: 'CHR-8942', name: 'Leila Farrokh', email: 'l.farrokh@chronos.io', role: 'Staff', status: 'Off-Site' },
  { id: 'CHR-8830', name: 'Arthur Pendelton', email: 'a.pendelton@chronos.io', role: 'Editor', status: 'On-Site' },
  { id: 'CHR-8722', name: 'Chioma Adebayo', email: 'c.adebayo@chronos.io', role: 'Staff', status: 'On-Site' },
  { id: 'CHR-8611', name: 'Gabriel Santos', email: 'g.santos@chronos.io', role: 'Staff', status: 'Off-Site' },
  { id: 'CHR-8504', name: 'Mei-Ling Zhou', email: 'm.zhou@chronos.io', role: 'Administrator', status: 'On-Site' },
  { id: 'CHR-8409', name: 'Tariq Al-Mansoor', email: 't.almansoor@chronos.io', role: 'Editor', status: 'On-Site' },
]

export const roleOptions = ['Senior Security Admin', 'Systems Editor', 'Logistics Officer', 'Field Technician', 'Standard Staff'] as const

export const filterTabs = ['All Roles', 'Administrators', 'Editors', 'Staff'] as const

export function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('')
}

export interface PaginatedRosterResult {
  members: RosterMember[]
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
}

export function queryRosterDatabase(params: {
  page: number
  pageSize: number
  search?: string
  roleTab?: string
  role?: string
}): PaginatedRosterResult {
  const { page, pageSize, search = '', roleTab = 'All Roles', role = 'admin' } = params

  let list = rosterMembers
  if (role === 'hod') {
    list = rosterMembers.filter(
      (m) =>
        m.role === 'Staff' ||
        m.name.includes('Marcus') ||
        m.name.includes('Elena') ||
        m.name.includes('Devon') ||
        m.name.includes('Sarah') ||
        m.name.includes('Aria') ||
        m.name.includes('Zara')
    )
  }

  const filtered = list.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    const matchesTab =
      roleTab === 'All Roles' ||
      (roleTab === 'Administrators' && m.role === 'Administrator') ||
      (roleTab === 'Editors' && m.role === 'Editor') ||
      (roleTab === 'Staff' && m.role === 'Staff')
    return matchesSearch && matchesTab
  })

  const totalItems = filtered.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const validPage = Math.min(Math.max(1, page), totalPages)
  const startIndex = (validPage - 1) * pageSize
  const paginatedMembers = filtered.slice(startIndex, startIndex + pageSize)

  return {
    members: paginatedMembers,
    totalItems,
    totalPages,
    currentPage: validPage,
    pageSize,
  }
}

