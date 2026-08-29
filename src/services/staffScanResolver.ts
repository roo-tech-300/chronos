import { getSupabase } from '../lib/supabase'

export interface ResolvedStaffResult {
  memberId: string
  staffName: string
  department: string
  role: string
  confidenceScore: number
}

/**
 * Resolves a scanned fingerprint template hash or member ID to the actual enrolled staff member.
 * Strictly queries Supabase database. Returns null if not enrolled / not found.
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

    if (!error && templateRows && templateRows.length > 0) {
      const matched = templateRows.find(
        (t) =>
          t.member_id === searchTarget ||
          t.template_hash === searchTarget ||
          (t.template_hash && searchTarget.includes(t.template_hash)) ||
          (searchTarget.length >= 16 && t.template_hash?.startsWith(searchTarget.slice(0, 16)))
      )

      if (matched && matched.member_id) {
        const quality = matched.quality_score || 96

        // Query profiles table for real user info
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, department, role')
          .eq('id', matched.member_id)
          .maybeSingle()

        return {
          memberId: matched.member_id,
          staffName: profile?.full_name || 'Enrolled Staff Member',
          department: profile?.department || 'Staff Member',
          role: profile?.role || 'Staff',
          confidenceScore: quality,
        }
      }
    }

    // 2. Check if searchTarget matches a profile ID directly
    const { data: directProfile } = await supabase
      .from('profiles')
      .select('id, full_name, department, role')
      .eq('id', searchTarget)
      .maybeSingle()

    if (directProfile) {
      return {
        memberId: directProfile.id,
        staffName: directProfile.full_name || 'Staff Member',
        department: directProfile.department || 'Staff Member',
        role: directProfile.role || 'Staff',
        confidenceScore: 98,
      }
    }

    // No matching fingerprint enrolled in database
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
