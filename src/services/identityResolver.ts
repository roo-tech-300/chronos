// Pure business logic: Resolving staff identity from workspace_members -> auth user profile
import { getSupabase } from '../lib/supabase'
import { rosterMembers } from '../dummy/roster-mock'

export interface ResolvedStaffIdentity {
  found: boolean
  isMemberOfWorkspace: boolean
  memberId: string
  userId?: string
  workspaceId?: string
  name: string
  email?: string
  department: string
  role: string
  avatarUrl?: string
  error?: string
}

export function formatRole(role?: string): string {
  switch (role?.toLowerCase()) {
    case 'owner':
      return 'Workspace Owner'
    case 'admin':
      return 'Administrator'
    case 'hod':
      return 'Head of Department (HOD)'
    case 'editor':
      return 'Editor'
    case 'staff':
      return 'Staff Member'
    case 'member':
      return 'Member'
    default:
      return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Staff Member'
  }
}

export function formatNameFromEmail(email?: string): string {
  if (!email) return 'User'
  const handle = email.split('@')[0] || ''
  return handle
    .split(/[._-]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
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
      const meta = (u.user_metadata || {}) as Record<string, unknown>
      const metaName = (meta.full_name || meta.name || meta.user_name || meta.display_name) as string | undefined
      return {
        userId: u.id,
        name: metaName || formatNameFromEmail(u.email) || 'Administrator',
        email: u.email,
        avatarUrl: (meta.avatar_url || meta.picture) as string | undefined,
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

export async function fetchUserIdentity(
  userId: string
): Promise<{ name?: string; email?: string; avatarUrl?: string; department?: string }> {
  if (!userId) return {}
  const supabase = getSupabase()

  // 1. Check if it's the currently signed in user
  try {
    const { data: authData } = await supabase.auth.getUser()
    if (authData?.user && authData.user.id === userId) {
      const u = authData.user
      const meta = (u.user_metadata || {}) as Record<string, unknown>
      const name = (meta.full_name || meta.name || meta.user_name) as string | undefined
      return {
        name: name || formatNameFromEmail(u.email),
        email: u.email,
        avatarUrl: (meta.avatar_url || meta.picture) as string | undefined,
      }
    }
  } catch {
    // Non-fatal
  }

  // 2. Query public.profiles table (safe wildcard to avoid column missing errors)
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (profile) {
      const name =
        profile.full_name ||
        profile.name ||
        profile.display_name ||
        (profile.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : '') ||
        formatNameFromEmail(profile.email)

      return {
        name,
        email: profile.email,
        avatarUrl: profile.avatar_url || profile.photo || profile.picture,
        department: profile.department,
      }
    }
  } catch (err) {
    console.warn('[IdentityResolver] Profiles query fallback:', err)
  }

  // 3. Check public.users table if present
  try {
    const { data: usr } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (usr) {
      const name =
        usr.full_name ||
        usr.name ||
        usr.display_name ||
        (usr.first_name ? `${usr.first_name} ${usr.last_name || ''}`.trim() : '') ||
        formatNameFromEmail(usr.email)

      return {
        name,
        email: usr.email,
        avatarUrl: usr.avatar_url,
      }
    }
  } catch {
    // Non-fatal
  }

  return {}
}

export async function fetchMemberProfilesMap(
  userIds: string[]
): Promise<Record<string, { full_name?: string; email?: string; avatar_url?: string; department?: string }>> {
  const profileMap: Record<string, { full_name?: string; email?: string; avatar_url?: string; department?: string }> = {}
  if (!userIds || userIds.length === 0) return profileMap

  const supabase = getSupabase()
  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds)

    if (profiles) {
      profiles.forEach((p) => {
        if (p.id) {
          const name =
            p.full_name ||
            p.name ||
            p.display_name ||
            (p.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : '') ||
            formatNameFromEmail(p.email)

          profileMap[p.id] = {
            full_name: name,
            email: p.email,
            avatar_url: p.avatar_url,
            department: p.department,
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
 * Resolves a scanned memberId or userId against workspace_members.
 * Checks workspace membership and resolves the auth user's identity.
 */
export async function resolveStaffByMemberId(
  rawMemberId: string,
  expectedWorkspaceId?: string
): Promise<ResolvedStaffIdentity | null> {
  const memberId = (rawMemberId || '').trim()
  if (!memberId) return null

  const supabase = getSupabase()
  const isDefaultOrg = !expectedWorkspaceId || expectedWorkspaceId === '00000000-0000-0000-0000-000000000000'

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
      const formattedRole = formatRole(wm.role)
      const resolvedDept = wm.department || userMeta.department || 'Academic Staff'

      let displayName = userMeta.name
      if (!displayName) {
        // Check roster mock as fallback
        const rosterMatch = rosterMembers.find((r) => r.id === wm.id || r.id === wm.user_id)
        displayName = rosterMatch?.name || formatNameFromEmail(userMeta.email) || `Staff (${wm.user_id.slice(0, 8)})`
      }

      return {
        found: true,
        isMemberOfWorkspace: true,
        memberId: wm.id,
        userId: wm.user_id,
        workspaceId: wm.workspace_id,
        name: displayName,
        email: userMeta.email,
        department: resolvedDept,
        role: formattedRole,
        avatarUrl: userMeta.avatarUrl,
      }
    }

    // 2. Direct profiles fallback check if memberId is a profile ID
    const directUser = await fetchUserIdentity(memberId)
    if (directUser.name) {
      // Check if user is in workspace_members
      const { data: wmByUserId } = await supabase
        .from('workspace_members')
        .select('id, user_id, role, department, workspace_id')
        .eq('user_id', memberId)
        .maybeSingle()

      if (wmByUserId) {
        const isMatchWorkspace = isDefaultOrg || !expectedWorkspaceId || wmByUserId.workspace_id === expectedWorkspaceId
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
    console.error('[IdentityResolver] Exception resolving workspace member:', err)
  }

  // 3. Check local mock dataset
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
