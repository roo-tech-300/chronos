// Auth-backed identity helpers: Supabase session metadata, profiles/users lookups
// and display formatting shared by every identity resolution path.
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

/** Resolves an auth user id to display identity: session metadata -> profiles -> users. */
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

  // 2. Query public.profiles table (safe wildcard to avoid column missing errors)
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (profile) {
      return {
        name:
          profile.full_name ||
          profile.name ||
          profile.display_name ||
          (profile.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : '') ||
          formatNameFromEmail(profile.email),
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
      return {
        name:
          usr.full_name ||
          usr.name ||
          usr.display_name ||
          (usr.first_name ? `${usr.first_name} ${usr.last_name || ''}`.trim() : '') ||
          formatNameFromEmail(usr.email),
        email: usr.email,
        avatarUrl: usr.avatar_url,
      }
    }
  } catch {
    // Non-fatal
  }

  return {}
}

export interface ProfileRecord {
  full_name?: string
  email?: string
  avatar_url?: string
  department?: string
}

/** Fetches display profiles for a batch of auth user ids (used by roster views). */
export async function fetchMemberProfilesMap(
  userIds: string[]
): Promise<Record<string, ProfileRecord>> {
  const profileMap: Record<string, ProfileRecord> = {}
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
    // Non-fatal: the profiles table may not exist in this environment yet.
  }
  return profileMap
}
