import { getSupabase } from '../lib/supabase'
import { isRealWorkspaceUuid, isUuid } from '../utils/uuid'
import {
  resolveCurrentAuthIdentity,
  fetchMemberProfilesMap,
  formatRole,
} from './identityResolver'
import type { WorkspaceMemberRecord } from '../types/tasks'

interface MemberRow {
  id: string
  role?: string | null
  department?: string | null
  user_id?: string | null
}

/** Maps a workspace_members row + its profile into the UI member record. */
function toMemberRecord(
  row: MemberRow,
  profileName?: string,
  profileAvatar?: string,
  profileEmail?: string,
): WorkspaceMemberRecord {
  return {
    memberId: row.id,
    userId: row.user_id || undefined,
    name: profileName || profileEmail || 'Team Member',
    email: profileEmail,
    avatarUrl: profileAvatar,
    role: row.role || undefined,
    roleLabel: formatRole(row.role || undefined),
    department: row.department || 'General Staff',
  }
}

/** Enriches raw member rows with their public.profiles display data. */
async function hydrateMembers(rows: MemberRow[]): Promise<WorkspaceMemberRecord[]> {
  const userIds = rows.map((r) => r.user_id).filter(Boolean) as string[]
  const profiles = await fetchMemberProfilesMap(userIds)

  return rows.map((row) => {
    const profile = row.user_id ? profiles[row.user_id] : undefined
    return toMemberRecord(
      row,
      profile?.full_name,
      profile?.avatar_url,
      profile?.email,
    )
  })
}

/**
 * Resolves the currently authenticated user's membership in a workspace.
 * Returns null when signed out, the workspace id is invalid, or no membership row exists.
 */
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
      .select('id, role, department, user_id')
      .eq('workspace_id', cleanId)
      .eq('user_id', auth.userId)
      .maybeSingle()

    if (error) {
      console.warn('[currentMemberService] Membership lookup failed:', error.message)
      return null
    }
    if (!data) return null
    const [hydrated] = await hydrateMembers([data])
    return hydrated ?? null
  } catch (err) {
    console.warn('[currentMemberService] Membership lookup error:', err)
    return null
  }
}

/**
 * Fetches the full staff roster of a workspace (real DB records only - no
 * mock seeding). Used by the tasks review grid and the task assignment modal.
 */
export async function fetchWorkspaceRoster(
  workspaceId: string
): Promise<WorkspaceMemberRecord[]> {
  const cleanId = (workspaceId || '').trim().toLowerCase()
  if (!isRealWorkspaceUuid(cleanId)) return []

  const supabase = getSupabase()
  try {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('id, role, department, user_id')
      .eq('workspace_id', cleanId)
      .order('created_at', { ascending: true })

    if (error) {
      console.warn('[currentMemberService] Roster fetch failed:', error.message)
      return []
    }
    return await hydrateMembers(data || [])
  } catch (err) {
    console.warn('[currentMemberService] Roster fetch error:', err)
    return []
  }
}