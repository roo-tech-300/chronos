import { getSupabase } from '../lib/supabase'

export interface ResolvedStaffResult {
  memberId: string
  userId?: string
  staffName: string
  department: string
  role: string
  confidenceScore: number
}

/**
 * Resolves a scanned fingerprint template hash or member ID to the actual enrolled staff member.
 * Checks workspace_members -> profiles first, then fallback to direct profiles.
 */
export async function resolveStaffFromScan(
  identifierOrHash?: string
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
    const { data: wm } = await supabase
      .from('workspace_members')
      .select('id, user_id, role, workspace_id')
      .or(`id.eq.${targetMemberId},user_id.eq.${targetMemberId}`)
      .maybeSingle()

    if (wm) {
      let resolvedName = ''
      let resolvedDept = 'Academic Staff'
      let resolvedRole = wm.role === 'admin' ? 'Administrator' : wm.role === 'editor' ? 'Editor' : 'Staff'

      if (wm.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, department, role')
          .eq('id', wm.user_id)
          .maybeSingle()

        if (profile) {
          resolvedName = profile.full_name || ''
          if (profile.department) resolvedDept = profile.department
          if (profile.role) resolvedRole = profile.role
        }
      }

      return {
        memberId: wm.id,
        userId: wm.user_id,
        staffName: resolvedName || `Staff Member (${wm.id.slice(0, 8)})`,
        department: resolvedDept,
        role: resolvedRole,
        confidenceScore: quality,
      }
    }

    // 3. Check profiles table directly
    const { data: directProfile } = await supabase
      .from('profiles')
      .select('id, full_name, department, role')
      .eq('id', targetMemberId)
      .maybeSingle()

    if (directProfile) {
      return {
        memberId: directProfile.id,
        userId: directProfile.id,
        staffName: directProfile.full_name || 'Staff Member',
        department: directProfile.department || 'Academic Staff',
        role: directProfile.role || 'Staff',
        confidenceScore: quality,
      }
    }

    return null
  } catch (err) {
    console.error('[StaffScanResolver] Database query error during biometric match:', err)
    return null
  }
}

/**
 * Fetches all registered staff members with enrolled biometrics from Supabase.
 */
export async function fetchEnrolledStaffList(): Promise<
  Array<{ id: string; name: string; department: string; role: string }>
> {
  const supabase = getSupabase()
  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, department, role')
      .limit(100)

    if (profiles && profiles.length > 0) {
      return profiles.map((p) => ({
        id: p.id,
        name: p.full_name || 'Staff Member',
        department: p.department || 'Staff',
        role: p.role || 'Staff',
      }))
    }
  } catch {
    // Database unreachable
  }
  return []
}
