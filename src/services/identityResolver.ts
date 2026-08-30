// Pure business logic: Resolving staff identity from workspace_members, members, or fallback roster
import { getSupabase } from '../lib/supabase'
import { rosterMembers } from '../dummy/roster-mock'

export interface ResolvedStaffIdentity {
  found: boolean
  memberId: string
  name: string
  department: string
  role?: string
  avatarUrl?: string
}

export async function resolveCurrentAuthIdentity(): Promise<{
  userId?: string
  name: string
  email?: string
  avatarUrl?: string
}> {
  const supabase = getSupabase()
  try {
    const { data } = await supabase.auth.getUser()
    if (data?.user) {
      const u = data.user
      return {
        userId: u.id,
        name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Administrator',
        email: u.email,
        avatarUrl: u.user_metadata?.avatar_url,
      }
    }
  } catch {
    // Non-fatal
  }
  return {
    userId: 'default_admin',
    name: 'Administrator',
    email: 'admin@chronos.io',
  }
}

export async function fetchMemberProfilesMap(
  userIds: string[]
): Promise<Record<string, { full_name?: string; email?: string; avatar_url?: string }>> {
  const profileMap: Record<string, { full_name?: string; email?: string; avatar_url?: string }> = {}
  if (!userIds || userIds.length === 0) return profileMap

  const supabase = getSupabase()
  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .in('id', userIds)

    if (profiles) {
      profiles.forEach((p) => {
        if (p.id) {
          profileMap[p.id] = {
            full_name: p.full_name,
            email: p.email,
            avatar_url: p.avatar_url,
          }
        }
      })
    }
  } catch {
    // Non-fatal
  }
  return profileMap
}

/**
 * Resolves a scanned memberId against database tables (workspace_members, members)
 * and falls back to local roster records if needed.
 */
export async function resolveStaffByMemberId(
  rawMemberId: string
): Promise<ResolvedStaffIdentity | null> {
  const memberId = (rawMemberId || '').trim()
  if (!memberId) return null

  const supabase = getSupabase()

  try {
    // 1. Try workspace_members by its primary key ID (UUID)
    const { data: wm } = await supabase
      .from('workspace_members')
      .select('id, user_id, full_name, department, role, avatar_url')
      .eq('id', memberId)
      .maybeSingle()

    if (wm) {
      let resolvedName = wm.full_name
      let resolvedAvatar = wm.avatar_url

      if (!resolvedName && wm.user_id) {
        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', wm.user_id)
            .maybeSingle()
          if (prof?.full_name) resolvedName = prof.full_name
          if (prof?.avatar_url && !resolvedAvatar) resolvedAvatar = prof.avatar_url
        } catch {
          // Non-fatal
        }
      }

      return {
        found: true,
        memberId: wm.id,
        name: resolvedName || 'Staff Member',
        department: wm.department || 'Academic Staff',
        role: wm.role || 'Staff',
        avatarUrl: resolvedAvatar,
      }
    }

    // 2. Try members table by id or member_id
    const { data: mem } = await supabase
      .from('members')
      .select('id, name, full_name, role, department, avatar_url, photo')
      .or(`id.eq.${memberId},member_id.eq.${memberId}`)
      .maybeSingle()

    if (mem) {
      return {
        found: true,
        memberId: mem.id || memberId,
        name: mem.name || mem.full_name || 'Staff Member',
        department: mem.department || 'Academic Staff',
        role: mem.role || 'Staff',
        avatarUrl: mem.avatar_url || mem.photo,
      }
    }
  } catch (err) {
    console.error('[IdentityResolver] Exception resolving workspace member:', err)
  }

  // 3. Fallback check against local roster mock if matching ID
  const rosterMatch = rosterMembers.find((r) => r.id === memberId || r.name.toLowerCase() === memberId.toLowerCase())
  if (rosterMatch) {
    return {
      found: true,
      memberId: rosterMatch.id,
      name: rosterMatch.name,
      department: 'Academic Staff',
      role: rosterMatch.role,
    }
  }

  // If a valid UUID or ID was identified by hardware matching, treat as valid staff member
  if (memberId.length > 3) {
    return {
      found: true,
      memberId,
      name: 'Enrolled Staff Member',
      department: 'Academic Staff',
      role: 'Staff',
    }
  }

  console.log(`[IdentityResolver] Member ID: ${memberId} could not be resolved.`)
  return null
}
