// Auth-backed identity helpers and display formatting shared by every identity
// resolution path.
import { getSupabase } from '../lib/supabase'

/** Maps a raw workspace_members role value to its display label. */
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

/** Derives a human display name from an email handle (john.doe@x -> John Doe). */
export function formatNameFromEmail(email?: string): string {
  if (!email) return ''
  const handle = email.split('@')[0] || ''
  return handle
    .split(/[._-]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

export interface SessionAuthIdentity {
  userId?: string
  name: string
  email?: string
  avatarUrl?: string
}

/** Resolves the currently authenticated Supabase user's display identity. */
export async function resolveCurrentAuthIdentity(): Promise<SessionAuthIdentity> {
  const supabase = getSupabase()
  try {
    const { data } = await supabase.auth.getUser()
    if (data?.user) {
      const u = data.user
      const meta = (u.user_metadata || {}) as Record<string, unknown>
      const metaName = (meta.full_name || meta.name || meta.user_name || meta.display_name) as
        | string
        | undefined
      return {
        userId: u.id,
        name: metaName || formatNameFromEmail(u.email) || 'Administrator',
        email: u.email,
        avatarUrl: (meta.avatar_url || meta.picture) as string | undefined,
      }
    }
  } catch {
    // Non-fatal: kiosk terminals usually run without an interactive user session.
  }
  return {
    userId: 'default_admin',
    name: 'Administrator',
    email: 'admin@chronos.io',
  }
}

export interface FetchedUserIdentity {
  name?: string
  email?: string
  avatarUrl?: string
  department?: string
}

/** Resolves an auth user id to display identity: session metadata -> Auth RPC. */
export async function fetchUserIdentity(userId: string): Promise<FetchedUserIdentity> {
  if (!userId) return {}
  const supabase = getSupabase()

  // 1. Check if it's the currently signed in user
  try {
    const { data: authData } = await supabase.auth.getUser()
    if (authData?.user && authData.user.id === userId) {
      const u = authData.user
      const meta = (u.user_metadata || {}) as Record<string, unknown>
      const name = (meta.full_name || meta.name || meta.user_name || meta.display_name) as
        | string
        | undefined
      return {
        name: name || formatNameFromEmail(u.email),
        email: u.email,
        avatarUrl: (meta.avatar_url || meta.picture) as string | undefined,
      }
    }
  } catch {
    // Non-fatal
  }

  // 2. Resolve another member through the security-definer Auth lookup.
  try {
    const { data } = await supabase.rpc('resolve_kiosk_identity', {
      p_identifier: userId,
    })
    const identity = Array.isArray(data) ? data[0] : data

    if (identity && typeof identity === 'object') {
      const record = identity as Record<string, unknown>
      return {
        name: typeof record.display_name === 'string' ? record.display_name : undefined,
        email: typeof record.email === 'string' ? record.email : undefined,
        avatarUrl: typeof record.avatar_url === 'string' ? record.avatar_url : undefined,
        department: typeof record.department === 'string' ? record.department : undefined,
      }
    }
  } catch (err) {
    console.warn('[IdentityResolver] Auth identity lookup fallback:', err)
  }

  // 3. No identity is available without Auth metadata or the RPC.
  try {
    return {}
  } catch {
    return {}
  }
}

export interface ProfileRecord {
  full_name?: string
  email?: string
  avatar_url?: string
  department?: string
}

/** Fetches Auth-backed display identities for roster members. */
export async function fetchMemberProfilesMap(
  userIds: string[],
  workspaceId?: string,
): Promise<Record<string, ProfileRecord>> {
  const identityMap: Record<string, ProfileRecord> = {}
  if (!userIds || userIds.length === 0) return identityMap

  const supabase = getSupabase()
  const identities = await Promise.all(
    Array.from(new Set(userIds)).map(async (userId) => {
      try {
        const { data } = await supabase.rpc('resolve_kiosk_identity', {
          p_identifier: userId,
          p_workspace_id: workspaceId || null,
        })
        const identity = Array.isArray(data) ? data[0] : data
        if (!identity || typeof identity !== 'object') return null
        const record = identity as Record<string, unknown>
        return {
          userId,
          profile: {
            full_name: typeof record.display_name === 'string' ? record.display_name : undefined,
            email: typeof record.email === 'string' ? record.email : undefined,
            avatar_url: typeof record.avatar_url === 'string' ? record.avatar_url : undefined,
            department: typeof record.department === 'string' ? record.department : undefined,
          },
        }
      } catch {
        return null
      }
    }),
  )

  identities.forEach((identity) => {
    if (identity) identityMap[identity.userId] = identity.profile
  })
  return identityMap
}
