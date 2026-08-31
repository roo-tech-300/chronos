// Legacy fallback chain for staff identity resolution with workspace-membership
// enforcement. Runs when the resolve_kiosk_identity RPC (migration 20260831) is not
// yet applied or could not produce a display name. NEVER fabricates a name from a
// raw member id - unresolvable names stay empty for the orchestrator to neutralize.
import { getSupabase } from '../lib/supabase'
import { rosterMembers } from '../dummy/roster-mock'
import { fetchUserIdentity, formatNameFromEmail, formatRole } from './authIdentity'
import type { ResolvedStaffIdentity } from '../types/identity'

const DEFAULT_ORG_UUID = '00000000-0000-0000-0000-000000000000'

/**
 * Upstream resolution chain: workspace_members -> auth user identity -> dev roster.
 * Mirrors the workspace-membership enforcement semantics of the RPC path.
 * Returns `name: ''` when a member row exists but no display name could be found.
 */
export async function resolveStaffByLegacyChain(
  rawMemberId: string,
  expectedWorkspaceId?: string
): Promise<ResolvedStaffIdentity | null> {
  const memberId = (rawMemberId || '').trim()
  if (!memberId) return null
  const supabase = getSupabase()
  const isDefaultOrg = !expectedWorkspaceId || expectedWorkspaceId === DEFAULT_ORG_UUID

  try {
    // 1. Query workspace_members for this specific member
    let query = supabase
      .from('workspace_members')
      .select('id, user_id, role, department, workspace_id')

    if (!isDefaultOrg && expectedWorkspaceId) {
      query = query.eq('workspace_id', expectedWorkspaceId)
    }

    const { data: wm, error: wmError } = await query
      .or(`id.eq.${memberId},user_id.eq.${memberId}`)
      .maybeSingle()

    // If not found in the expected workspace, check if member exists in another workspace
    if ((!wm || wmError) && !isDefaultOrg && expectedWorkspaceId) {
      const { data: otherWsMember } = await supabase
        .from('workspace_members')
        .select('id, user_id, role, department, workspace_id')
        .or(`id.eq.${memberId},user_id.eq.${memberId}`)
        .maybeSingle()

      if (otherWsMember) {
        return {
          found: false,
          isMemberOfWorkspace: false,
          memberId: otherWsMember.id,
          userId: otherWsMember.user_id,
          workspaceId: otherWsMember.workspace_id,
          name: 'Unauthorized Member',
          department: otherWsMember.department || 'Staff',
          role: formatRole(otherWsMember.role),
          error: 'User is not a member of this workspace.',
        }
      }
    }

    if (!wmError && wm) {
      const userMeta = await fetchUserIdentity(wm.user_id)
      let displayName = userMeta.name
      if (!displayName) {
        const rosterMatch = rosterMembers.find((r) => r.id === wm.id || r.id === wm.user_id)
        displayName = rosterMatch?.name || formatNameFromEmail(userMeta.email) || ''
      }

      return {
        found: true,
        isMemberOfWorkspace: true,
        memberId: wm.id,
        userId: wm.user_id,
        workspaceId: wm.workspace_id,
        name: displayName,
        email: userMeta.email,
        department: wm.department || userMeta.department || 'Academic Staff',
        role: formatRole(wm.role),
        avatarUrl: userMeta.avatarUrl,
      }
    }

    // 2. Direct identity fallback if the identifier is an auth user id
    const directUser = await fetchUserIdentity(memberId)
    if (directUser.name) {
      const { data: wmByUserId } = await supabase
        .from('workspace_members')
        .select('id, user_id, role, department, workspace_id')
        .eq('user_id', memberId)
        .maybeSingle()

      if (wmByUserId) {
        const isMatchWorkspace =
          isDefaultOrg || !expectedWorkspaceId || wmByUserId.workspace_id === expectedWorkspaceId
        if (!isMatchWorkspace) {
          return {
            found: false,
            isMemberOfWorkspace: false,
            memberId: wmByUserId.id,
            userId: memberId,
            workspaceId: wmByUserId.workspace_id,
            name: directUser.name,
            department: wmByUserId.department || 'Staff',
            role: formatRole(wmByUserId.role),
            error: 'User is not a member of this workspace.',
          }
        }

        return {
          found: true,
          isMemberOfWorkspace: true,
          memberId: wmByUserId.id,
          userId: memberId,
          workspaceId: wmByUserId.workspace_id,
          name: directUser.name,
          email: directUser.email,
          department: wmByUserId.department || directUser.department || 'Academic Staff',
          role: formatRole(wmByUserId.role),
          avatarUrl: directUser.avatarUrl,
        }
      }
    }
  } catch (err) {
    console.error('[StaffIdentityChain] Lookup error:', err)
  }

  // 3. Local dev roster mock (never used in production data paths)
  const rosterMatch = rosterMembers.find(
    (r) => r.id === memberId || r.name.toLowerCase() === memberId.toLowerCase()
  )
  if (rosterMatch) {
    return {
      found: true,
      isMemberOfWorkspace: true,
      memberId: rosterMatch.id,
      name: rosterMatch.name,
      email: rosterMatch.email,
      department: 'Academic Staff',
      role: formatRole(rosterMatch.role),
    }
  }

  return {
    found: false,
    isMemberOfWorkspace: false,
    memberId,
    name: 'Unrecognized Member',
    department: '',
    role: 'Unknown',
    error: 'User is not a member of this workspace.',
  }
}
