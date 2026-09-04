import { getSupabase } from '../lib/supabase'
import { isRealWorkspaceUuid, isUuid } from '../utils/uuid'
import {
  resolveCurrentAuthIdentity,
  fetchMemberProfilesMap,
  formatRole,
} from './identityResolver'
import type { WorkspaceMemberRecord } from '../types/tasks'
import { assertUnitAssignmentRows } from '../utils/supabaseTypeGuards'

interface MemberRow {
  id: string
  role?: string | null
  department?: string | null
  user_id?: string | null
  unit_id?: string | null
  job_title?: string | null
}

/** Maps a workspace_members row + its profile into the UI member record. */
function toMemberRecord(
  row: MemberRow,
  profileName?: string,
  profileAvatar?: string,
  profileEmail?: string,
  unitIds?: string[]
): WorkspaceMemberRecord {
  const finalUnitIds = unitIds && unitIds.length > 0 ? unitIds : row.unit_id ? [row.unit_id] : []

  return {
    memberId: row.id,
    userId: row.user_id || undefined,
    name: profileName || profileEmail || 'Team Member',
    email: profileEmail,
    avatarUrl: profileAvatar,
    role: row.role || undefined,
    roleLabel: formatRole(row.role || undefined),
    department: row.department || 'General Staff',
    unitId: row.unit_id || finalUnitIds[0] || undefined,
    unitIds: finalUnitIds,
    jobTitle: row.job_title || undefined,
  }
}

/** Enriches raw member rows with public.profiles display data and multi-unit assignments. */
async function hydrateMembers(rows: MemberRow[], workspaceId?: string): Promise<WorkspaceMemberRecord[]> {
  if (rows.length === 0) return []

  const supabase = getSupabase()
  const userIds = rows.map((r) => r.user_id).filter(Boolean) as string[]
  const memberIds = rows.map((r) => r.id)

  const [profiles, assignmentsResult] = await Promise.all([
    fetchMemberProfilesMap(userIds, workspaceId),
    supabase
      .from('organization_unit_members')
      .select('member_id, unit_id')
      .in('member_id', memberIds),
  ])

  const assignmentsByMember = new Map<string, string[]>()
  if (!assignmentsResult.error && assignmentsResult.data) {
    for (const item of assertUnitAssignmentRows(assignmentsResult.data)) {
      const list = assignmentsByMember.get(item.member_id) || []
      list.push(item.unit_id)
      assignmentsByMember.set(item.member_id, list)
    }
  }

  return rows.map((row) => {
    const profile = row.user_id ? profiles[row.user_id] : undefined
    const unitIds = assignmentsByMember.get(row.id)
    return toMemberRecord(
      row,
      profile?.full_name,
      profile?.avatar_url,
      profile?.email,
      unitIds
    )
  })
}

/** Resolves the currently authenticated user's membership in a workspace. */
export async function fetchCurrentWorkspaceMember(
  workspaceId: string
): Promise<WorkspaceMemberRecord | null> {
  const cleanId = (workspaceId || '').trim().toLowerCase()
  if (!isRealWorkspaceUuid(cleanId)) return null

  const auth = await resolveCurrentAuthIdentity()
  if (!auth.userId || !isUuid(auth.userId)) return null

  const supabase = getSupabase()
  try {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('id, role, department, user_id, unit_id, job_title')
      .eq('workspace_id', cleanId)
      .eq('user_id', auth.userId)
      .maybeSingle()

    if (error || !data) return null
    const [hydrated] = await hydrateMembers([data], cleanId)
    return hydrated ?? null
  } catch (err) {
    console.warn('[currentMemberService] Membership lookup error:', err)
    return null
  }
}

/** Fetches the full staff roster of a workspace with multi-unit assignments. */
export async function fetchWorkspaceRoster(
  workspaceId: string
): Promise<WorkspaceMemberRecord[]> {
  const cleanId = (workspaceId || '').trim().toLowerCase()
  if (!isRealWorkspaceUuid(cleanId)) return []

  const supabase = getSupabase()
  try {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('id, role, department, user_id, unit_id, job_title')
      .eq('workspace_id', cleanId)
      .order('created_at', { ascending: true })

    if (error) return []
    return await hydrateMembers(data || [], cleanId)
  } catch (err) {
    console.warn('[currentMemberService] Roster fetch error:', err)
    return []
  }
}