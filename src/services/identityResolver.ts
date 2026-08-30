// Pure business logic: Resolving staff identity from workspace_members -> profiles
import { getSupabase } from '../lib/supabase'
import { rosterMembers } from '../dummy/roster-mock'

export interface ResolvedStaffIdentity {
  found: boolean
  memberId: string
  userId?: string
  name: string
  email?: string
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
): Promise<Record<string, { full_name?: string; email?: string; avatar_url?: string; department?: string; role?: string }>> {
  const profileMap: Record<string, { full_name?: string; email?: string; avatar_url?: string; department?: string; role?: string }> = {}
  if (!userIds || userIds.length === 0) return profileMap

  const supabase = getSupabase()
  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, department, role')
      .in('id', userIds)

    if (profiles) {
      profiles.forEach((p) => {
        if (p.id) {
          profileMap[p.id] = {
            full_name: p.full_name,
            email: p.email,
            avatar_url: p.avatar_url,
            department: p.department,
            role: p.role,
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
 * Resolves a scanned memberId against workspace_members, gets the user_id,
 * and fetches the user profile from profiles table to display full name, department, avatar, and role.
 */
export async function resolveStaffByMemberId(
  rawMemberId: string
): Promise<ResolvedStaffIdentity | null> {
  const memberId = (rawMemberId || '').trim()
  if (!memberId) return null

  const supabase = getSupabase()

  try {
    // 1. Fetch workspace_members record by id or user_id
    const { data: wm, error: wmError } = await supabase
      .from('workspace_members')
      .select('id, user_id, role, workspace_id')
      .or(`id.eq.${memberId},user_id.eq.${memberId}`)
      .maybeSingle()

    if (!wmError && wm) {
      let resolvedName = ''
      let resolvedEmail = ''
      let resolvedAvatar: string | undefined
      let resolvedDept = 'Academic Staff'
      let resolvedRole = wm.role === 'admin' ? 'Administrator' : wm.role === 'editor' ? 'Editor' : 'Staff'

      // 2. Fetch User details from profiles using workspace_members.user_id
      if (wm.user_id) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url, department, role')
            .eq('id', wm.user_id)
            .maybeSingle()

          if (profile) {
            resolvedName = profile.full_name || profile.email?.split('@')[0] || ''
            resolvedEmail = profile.email || ''
            resolvedAvatar = profile.avatar_url
            if (profile.department) resolvedDept = profile.department
            if (profile.role) resolvedRole = profile.role
          }
        } catch (profErr) {
          console.warn('[IdentityResolver] Could not load profile for user_id:', wm.user_id, profErr)
        }
      }

      if (!resolvedName) {
        resolvedName = wm.user_id ? `Staff Member (${wm.user_id.slice(0, 8)})` : `Staff Member (${wm.id.slice(0, 8)})`
      }

      return {
        found: true,
        memberId: wm.id,
        userId: wm.user_id,
        name: resolvedName,
        email: resolvedEmail,
        department: resolvedDept,
        role: resolvedRole,
        avatarUrl: resolvedAvatar,
      }
    }

    // 3. Fallback check profiles directly if memberId is a profile user ID
    const { data: directProfile } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, department, role')
      .eq('id', memberId)
      .maybeSingle()

    if (directProfile) {
      return {
        found: true,
        memberId: directProfile.id,
        userId: directProfile.id,
        name: directProfile.full_name || directProfile.email?.split('@')[0] || 'Staff Member',
        email: directProfile.email,
        department: directProfile.department || 'Academic Staff',
        role: directProfile.role || 'Staff',
        avatarUrl: directProfile.avatar_url,
      }
    }

    // 4. Fallback check members table
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

  // 5. Check local mock dataset
  const rosterMatch = rosterMembers.find(
    (r) => r.id === memberId || r.name.toLowerCase() === memberId.toLowerCase()
  )
  if (rosterMatch) {
    return {
      found: true,
      memberId: rosterMatch.id,
      name: rosterMatch.name,
      email: rosterMatch.email,
      department: 'Academic Staff',
      role: rosterMatch.role,
    }
  }

  // If valid format but no profile row yet, display formatted member badge
  if (memberId.length > 3) {
    return {
      found: true,
      memberId,
      name: `Staff Member (${memberId.slice(0, 8)})`,
      department: 'Academic Staff',
      role: 'Staff',
    }
  }

  return null
}
