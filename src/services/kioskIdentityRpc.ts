// Data access: single round-trip kiosk identity lookup (migration 20260831).
// The RPC is SECURITY DEFINER so a paired kiosk (anon key, no user session) can
// translate a scanned identifier into display-safe fields without RLS exceptions.
// Workspace-membership enforcement parity with the legacy chain is kept via the
// `matches_workspace` flag returned by the function.
import { getSupabase } from '../lib/supabase'
import { isUuid } from '../utils/uuid'
import type { ResolvedStaffIdentity } from '../types/identity'

const DEFAULT_ORG_UUID = '00000000-0000-0000-0000-000000000000'

/** Row shape returned by the `resolve_kiosk_identity` Postgres function. */
interface KioskIdentityRpcRow {
  member_id: string | null
  user_id: string | null
  workspace_id: string | null
  display_name: string | null
  email: string | null
  department: string | null
  role_label: string | null
  avatar_url: string | null
  matches_workspace: boolean | null
}

/**
 * Resolves a scanned identifier (workspace_members.id or auth user_id) into a
 * display identity in ONE network round-trip. Returns null when the migration is
 * pending or the identifier matches nobody, letting callers use the fallback chain.
 */
export async function resolveIdentityViaKioskRpc(
  identifier: string,
  workspaceId?: string
): Promise<ResolvedStaffIdentity | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc('resolve_kiosk_identity', {
      p_identifier: identifier,
      p_workspace_id: workspaceId && isUuid(workspaceId) ? workspaceId : null,
    })

    if (error) {
      console.warn('[KioskIdentity] RPC unavailable (migration pending?):', error.message)
      return null
    }

    const rows = (Array.isArray(data) ? data : data ? [data] : []) as KioskIdentityRpcRow[]
    const row = rows[0]
    if (!row?.member_id) return null

    // Default-org kiosks accept any member; scoped kiosks require a workspace match.
    const isDefaultOrg = !workspaceId || workspaceId === DEFAULT_ORG_UUID
    const isMemberOfWorkspace = isDefaultOrg || row.matches_workspace === true

    if (!isMemberOfWorkspace) {
      return {
        found: false,
        isMemberOfWorkspace: false,
        memberId: row.member_id,
        userId: row.user_id ?? undefined,
        workspaceId: row.workspace_id ?? undefined,
        name: 'Unauthorized Member',
        department: row.department?.trim() || 'Staff',
        role: row.role_label ?? 'Staff Member',
        error: 'User is not a member of this workspace.',
      }
    }

    return {
      found: true,
      isMemberOfWorkspace: true,
      memberId: row.member_id,
      userId: row.user_id ?? undefined,
      workspaceId: row.workspace_id ?? undefined,
      name: row.display_name?.trim() || '',
      email: row.email ?? undefined,
      department: row.department?.trim() || 'Staff',
      role: row.role_label ?? 'Staff Member',
      avatarUrl: row.avatar_url ?? undefined,
    }
  } catch (err) {
    console.warn('[KioskIdentity] RPC exception:', err)
    return null
  }
}
