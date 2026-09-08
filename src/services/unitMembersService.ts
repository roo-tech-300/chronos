import { getSupabase } from '../lib/supabase'
import { isUuid } from '../utils/uuid'
import { fetchMemberProfilesMap, formatRole } from './identityResolver'
import { assertMemberWithAssignmentRows } from '../utils/supabaseTypeGuards'

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
    .select('id, unit_id, member_id, job_title, member:workspace_members!inner(id, user_id, role, department, workspace_id)')
    .eq('unit_id', cleanId)

  if (error) {
    console.warn('[unitMembersService] Unit members fetch failed:', error.message)
    return { data: [], error: new Error(error.message) }
  }

  const rows = assertMemberWithAssignmentRows(data)
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
    }
  })

  return { data: items, error: null }
}
