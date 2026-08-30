// Pure business logic: Resolving staff identity strictly from workspace_members table
import { getSupabase } from '../lib/supabase'

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
 * Resolves a scanned memberId strictly against the workspace_members table.
 * If the memberId (workspace_members.id UUID) does not exist in workspace_members,
 * returns null (triggering 'User is not a member of this organisation.').
 */
export async function resolveStaffByMemberId(
  rawMemberId: string
): Promise<ResolvedStaffIdentity | null> {
  const memberId = (rawMemberId || '').trim()
  if (!memberId) return null

  const supabase = getSupabase()

  try {
    // Query workspace_members by its primary key ID (UUID)
    const { data: wm, error } = await supabase
      .from('workspace_members')
      .select('id, user_id, full_name, department, role, avatar_url')
      .eq('id', memberId)
      .maybeSingle()

    if (error) {
      console.warn('[IdentityResolver] Query error on workspace_members:', error.message)
      return null
    }

    if (wm) {
      let resolvedName = wm.full_name
      let resolvedAvatar = wm.avatar_url

      // If user_id exists and full_name is missing, retrieve from user profiles
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
  } catch (err) {
    console.error('[IdentityResolver] Exception resolving workspace member:', err)
  }

  // Not found in workspace_members table
  console.log(`member id: ${memberId} not found in table`)
  return null
}
