import { getSupabase } from '../lib/supabase'
import { fetchUserIdentity, formatRole } from './identityResolver'

export interface ResolvedStaffResult {
  memberId: string
  userId?: string
  staffName: string
  department: string
  role: string
  confidenceScore: number
}

/**
 * Resolves a scanned fingerprint template hash or member ID to the enrolled staff member.
 * Queries workspace_members -> fetches user identity from Auth/profiles.
 */
export async function resolveStaffFromScan(
  identifierOrHash?: string,
  workspaceId?: string
): Promise<ResolvedStaffResult | null> {
  const supabase = getSupabase()

  if (!identifierOrHash || identifierOrHash.trim().length === 0) {
    return null
  }

  const searchTarget = identifierOrHash.trim()

  try {
    // 1. Query biometric_templates table for enrolled match
    const { data: templateRows, error } = await supabase
      .from('biometric_templates')
      .select('member_id, template_hash, quality_score')
      .limit(200)

    let targetMemberId = searchTarget
    let quality = 98

    if (!error && templateRows && templateRows.length > 0) {
      const matched = templateRows.find(
        (t) =>
          t.member_id === searchTarget ||
          t.template_hash === searchTarget ||
          (t.template_hash && searchTarget.includes(t.template_hash)) ||
          (searchTarget.length >= 16 && t.template_hash?.startsWith(searchTarget.slice(0, 16)))
      )

      if (matched && matched.member_id) {
        targetMemberId = matched.member_id
        quality = matched.quality_score || 96
      }
    }

    // 2. Query workspace_members by targetMemberId
    let wmQuery = supabase
      .from('workspace_members')
      .select('id, user_id, role, department, workspace_id')

    if (workspaceId && workspaceId !== '00000000-0000-0000-0000-000000000000') {
      wmQuery = wmQuery.eq('workspace_id', workspaceId)
    }

    const { data: wm } = await wmQuery
      .or(`id.eq.${targetMemberId},user_id.eq.${targetMemberId}`)
      .maybeSingle()

    if (wm) {
      const userMeta = wm.user_id ? await fetchUserIdentity(wm.user_id) : {}
      const resolvedName = userMeta.name || `Member (${wm.id.slice(0, 8)})`
      const resolvedDept = wm.department || userMeta.department || 'Academic Staff'
      const resolvedRole = formatRole(wm.role)

      return {
        memberId: wm.id,
        userId: wm.user_id,
        staffName: resolvedName,
        department: resolvedDept,
        role: resolvedRole,
        confidenceScore: quality,
      }
    }

    // 3. Fallback check by profile ID
    const directUser = await fetchUserIdentity(targetMemberId)
    if (directUser.name) {
      return {
        memberId: targetMemberId,
        userId: targetMemberId,
        staffName: directUser.name,
        department: directUser.department || 'Academic Staff',
        role: 'Staff Member',
        confidenceScore: quality,
      }
    }

    return null
  } catch (err) {
    console.error('[StaffScanResolver] Biometric match error:', err)
    return null
  }
}

/**
 * Fetches all registered staff members with enrolled biometrics from Supabase.
 */
export async function fetchEnrolledStaffList(
  workspaceId?: string
): Promise<Array<{ id: string; name: string; department: string; role: string }>> {
  const supabase = getSupabase()
  try {
    let query = supabase
      .from('workspace_members')
      .select('id, user_id, role, department, workspace_id')

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    const { data: wmList } = await query.limit(100)

    if (wmList && wmList.length > 0) {
      const results = await Promise.all(
        wmList.map(async (wm) => {
          const userMeta = wm.user_id ? await fetchUserIdentity(wm.user_id) : {}
          return {
            id: wm.id,
            name: userMeta.name || `Staff (${wm.id.slice(0, 8)})`,
            department: wm.department || userMeta.department || 'Staff',
            role: formatRole(wm.role),
          }
        })
      )
      return results
    }
  } catch {
    // Non-fatal
  }
  return []
}
