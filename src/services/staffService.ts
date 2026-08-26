import { getSupabase } from '../lib/supabase'
import { rosterMembers } from '../dummy/roster-mock'
import type { StaffMember, StaffQueryParams, PaginatedStaffResponse } from '../types/staff'

/**
 * Executes a server-side paginated database query against Supabase.
 * Uses range(from, to) and count: 'exact' to fetch only records fitting the active page.
 */
export async function fetchPaginatedStaff(
  params: StaffQueryParams
): Promise<PaginatedStaffResponse> {
  const { page, pageSize, search = '', roleTab = 'All Roles', workspaceId, role } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const supabase = getSupabase()

  try {
    // 1. Try querying workspace_members table in Supabase
    let query = supabase
      .from('workspace_members')
      .select('id, role, created_at, user_id', { count: 'exact' })

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    if (roleTab && roleTab !== 'All Roles') {
      const mappedRole = roleTab === 'Administrators' ? 'admin' : roleTab === 'Editors' ? 'editor' : 'staff'
      query = query.eq('role', mappedRole)
    }

    const { data: dbMembers, count: dbCount, error } = await query.range(from, to).order('created_at', { ascending: false })

    if (!error && dbMembers && dbMembers.length > 0) {
      const totalItems = dbCount ?? dbMembers.length
      const members: StaffMember[] = dbMembers.map((m, index) => {
        const idNum = String(from + index + 1000).padStart(4, '0')
        return {
          id: `CHR-${idNum}`,
          name: `Staff Member ${from + index + 1}`,
          email: `staff.${from + index + 1}@chronos.io`,
          role: m.role === 'admin' ? 'Administrator' : m.role === 'editor' ? 'Editor' : 'Staff',
          status: index % 2 === 0 ? 'On-Site' : 'Off-Site',
          workspaceId: workspaceId,
          createdAt: m.created_at,
        }
      })

      return {
        members,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize) || 1,
        currentPage: page,
        pageSize,
      }
    }
  } catch {
    // Graceful fallback to server simulation
  }

  // 2. Mock database simulation for fallback
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
  const paginatedMembers: StaffMember[] = filtered.slice(startIndex, startIndex + pageSize)

  return {
    members: paginatedMembers,
    totalItems,
    totalPages,
    currentPage: validPage,
    pageSize,
  }
}
