import { getSupabase } from '../lib/supabase'

export interface ResolvedIdentity {
  userId?: string
  name: string
  email: string
  avatarUrl?: string
}

export async function resolveCurrentAuthIdentity(): Promise<ResolvedIdentity> {
  const supabase = getSupabase()
  let userId: string | undefined
  let name = ''
  let email = ''
  let avatarUrl: string | undefined

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      userId = user.id
      email = user.email || ''
      const meta = (user.user_metadata || {}) as Record<string, string | undefined>
      name = meta.full_name || meta.name || meta.user_name || ''
      avatarUrl = meta.avatar_url || meta.picture

      try {
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle()

        if (profileRow?.full_name) {
          name = profileRow.full_name
        }
        if (profileRow?.avatar_url) {
          avatarUrl = profileRow.avatar_url
        }
      } catch {
        // Fallback to metadata
      }

      if (!name && email) {
        name = email.split('@')[0]
      }
    }
  } catch {
    // Offline fallback
  }

  return {
    userId,
    name: name || 'Team Administrator',
    email,
    avatarUrl,
  }
}

export async function fetchMemberProfilesMap(
  userIds: string[]
): Promise<Record<string, { full_name?: string; email?: string; avatar_url?: string }>> {
  const map: Record<string, { full_name?: string; email?: string; avatar_url?: string }> = {}
  if (userIds.length === 0) return map

  const supabase = getSupabase()
  try {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .in('id', userIds)

    if (profs) {
      profs.forEach((p) => {
        map[p.id] = p
      })
    }
  } catch {
    // Graceful fallback
  }

  return map
}
