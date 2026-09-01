import type { SupabaseClient } from '@supabase/supabase-js'
import { isUuid } from '../utils/uuid'

/**
 * Resolves any staff identifier into the canonical workspace_members.id that
 * attendance_logs.member_id references. Accepted inputs:
 *   - workspace_members.id (canonical, returned as-is)
 *   - auth user_id (resolved through workspace_members.user_id)
 *   - CHR-XXXX staff codes (derived from the first 4 chars of the auth user id)
 * Returns null when the identifier cannot be tied to a workspace member.
 */
export async function resolveAttendanceMemberId(
  supabase: SupabaseClient,
  identifier: string
): Promise<string | null> {
  const cleanId = (identifier || '').trim()
  if (!cleanId) return null

  // CHR staff codes derive from the first 4 hex chars of the auth user id
  if (/^chr-[0-9a-f]{4}$/i.test(cleanId)) {
    const prefix = cleanId.slice(4).toLowerCase()
    try {
      const { data } = await supabase
        .from('workspace_members')
        .select('id, user_id')
        .like('user_id', `${prefix}%`)
        .limit(1)
      if (data?.[0]?.id) return data[0].id
    } catch {
      // Non-fatal: fall through to null
    }
    return null
  }

  if (isUuid(cleanId)) {
    // A UUID may be a workspace_members.id (canonical) or an auth user_id.
    // When the lookup is inconclusive (RLS / offline), the UUID itself is the
    // best candidate - the logs query simply returns no rows for it.
    try {
      const { data } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('user_id', cleanId)
        .maybeSingle()
      if (data?.id) return data.id
    } catch {
      // Non-fatal: fall through
    }
    return cleanId
  }

  return null
}
