import { getSupabase } from '../lib/supabase'
import { isUuid } from '../utils/uuid'
import { fetchMemberProfilesMap, formatRole } from './identityResolver'
import type { AssignmentType } from '../types/organization'

export interface UnitMemberItem {
  id: string
  memberId: string
  userId?: string
  name: string
  email?: string
  avatarUrl?: string
  role?: string
  roleLabel: string
  jobTitle?: string
  isPrimary: boolean
  assignmentType: AssignmentType
  reportsTo?: string | null
}

interface MemberWithAssignmentRow {
  id: string
  unit_id: string
  member_id: string
  is_primary: boolean
  assignment_type: AssignmentType
  job_title: string | null
  reports_to: string | null
  member: {
    id: string
    user_id: string | null
    role: string | null
    department: string | null
    workspace_id: string
  }
}

/**
 * Fetches all members assigned to a specific organization unit (primary or secondary).
 * Hydrates profile details (full name, avatar) from public.profiles.
 */
export async function fetchUnitMembers(
  unitId: string
): Promise<{ data: UnitMemberItem[]; error: Error | null }> {
  const cleanId = (unitId || '').trim()
  if (!isUuid(cleanId)) return { data: [], error: new Error('Invalid unit id.') }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('organization_unit_members')
    .select('id, unit_id, member_id, is_primary, assignment_type, job_title, reports_to, member:workspace_members!inner(id, user_id, role, department, workspace_id)')
    .eq('unit_id', cleanId)
    .order('is_primary', { ascending: false })

  if (error) {
    console.warn('[unitMembersService] Unit members fetch failed:', error.message)
    return { data: [], error: new Error(error.message) }
  }

  const rows = (data ?? []) as unknown as MemberWithAssignmentRow[]
  const userIds = rows.map((r) => r.member.user_id).filter(Boolean) as string[]
  const workspaceId = rows[0]?.member?.workspace_id
  const profiles = await fetchMemberProfilesMap(userIds, workspaceId)

  const items: UnitMemberItem[] = rows.map((row) => {
    const profile = row.member.user_id ? profiles[row.member.user_id] : undefined
    return {
      id: row.id,
      memberId: row.member_id,
      userId: row.member.user_id || undefined,
      name: profile?.full_name || profile?.email || 'Team Member',
      email: profile?.email,
      avatarUrl: profile?.avatar_url,
      role: row.member.role || undefined,
      roleLabel: formatRole(row.member.role || undefined),
      jobTitle: row.job_title || undefined,
      isPrimary: row.is_primary,
      assignmentType: row.assignment_type,
      reportsTo: row.reports_to,
    }
  })

  return { data: items, error: null }
}
