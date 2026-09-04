import { getSupabase } from '../lib/supabase'
import { isUuid } from '../utils/uuid'
import { assertMemberIdRows } from '../utils/supabaseTypeGuards'

/**
 * All member IDs a leader has authority over (self + every unit they head +
 * every subordinate unit), via the get_subordinate_member_ids RPC.
 * Checks both workspace_members and organization_unit_members.
 */
export async function fetchSubordinateMemberIds(leaderMemberId: string): Promise<string[]> {
  const cleanId = (leaderMemberId || '').trim()
  if (!isUuid(cleanId)) return []

  const supabase = getSupabase()
  const { data, error } = await supabase.rpc('get_subordinate_member_ids', {
    p_leader_member_id: cleanId,
  })

  if (error) {
    console.warn('[organizationAuthorityService] Subordinate RPC failed:', error.message)
    return []
  }

  return assertMemberIdRows(data).map((row) => row.member_id)
}

/**
 * True when the manager has hierarchical or direct-supervisor authority over
 * the target member, via the can_manage_member RPC. Supports optional unit context.
 */
export async function canManageMember(
  managerMemberId: string,
  targetMemberId: string,
  contextUnitId?: string
): Promise<boolean> {
  const cleanManagerId = (managerMemberId || '').trim()
  const cleanTargetId = (targetMemberId || '').trim()
  if (!isUuid(cleanManagerId) || !isUuid(cleanTargetId)) return false

  const cleanContextUnitId = contextUnitId && isUuid(contextUnitId.trim()) ? contextUnitId.trim() : null

  const supabase = getSupabase()
  const { data, error } = await supabase.rpc('can_manage_member', {
    p_manager_member_id: cleanManagerId,
    p_target_member_id: cleanTargetId,
    p_context_unit_id: cleanContextUnitId,
  })

  if (error) {
    console.warn('[organizationAuthorityService] Authority RPC failed:', error.message)
    return false
  }

  return Boolean(data)
}
