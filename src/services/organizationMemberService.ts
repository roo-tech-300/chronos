import { getSupabase } from '../lib/supabase'
import { isUuid } from '../utils/uuid'
import type { PostgrestError } from '@supabase/supabase-js'
import type {
  MemberAssignment,
  MemberAssignmentRow,
  MemberUnitLineage,
  OrganizationUnitRow,
} from '../types/organization'
import { mapUnitRow } from './organizationUnitService'

function translateMemberError(error: PostgrestError | null, fallback: string): Error {
  if (error?.code === '42501') {
    return new Error('Only workspace owners and admins can re-assign members.')
  }
  return new Error(error?.message || fallback)
}

/**
 * Assigns a member to a unit and optionally sets their direct supervisor.
 * Pass reportsTo as an explicit null to clear the supervisor while keeping
 * the unit. RLS restricts member updates to owners & admins.
 */
export async function assignMemberToUnit(
  memberId: string,
  unitId: string,
  reportsTo?: string | null
): Promise<{ data: MemberAssignment | null; error: Error | null }> {
  const cleanMemberId = (memberId || '').trim()
  const cleanUnitId = (unitId || '').trim()
  if (!isUuid(cleanMemberId)) {
    return { data: null, error: new Error('A valid member id is required.') }
  }
  if (!isUuid(cleanUnitId)) {
    return { data: null, error: new Error('A valid unit id is required.') }
  }

  const payload: { unit_id: string; reports_to?: string | null } = { unit_id: cleanUnitId }
  if (reportsTo !== undefined) {
    if (reportsTo !== null && !isUuid(reportsTo)) {
      return { data: null, error: new Error('A valid supervisor member id is required.') }
    }
    payload.reports_to = reportsTo
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('workspace_members')
    .update(payload)
    .eq('id', cleanMemberId)
    .select('id, unit_id, reports_to, job_title')
    .single()

  if (error || !data) {
    const notFound = error?.code === 'PGRST116'
    return {
      data: null,
      error: notFound
        ? new Error('Member not found or you do not have permission to update it.')
        : translateMemberError(error, 'Failed to assign the member to the unit.'),
    }
  }

  const row = data as unknown as MemberAssignmentRow
  return {
    data: {
      memberId: row.id,
      unitId: row.unit_id,
      reportsTo: row.reports_to,
      jobTitle: row.job_title,
    },
    error: null,
  }
}

/**
 * Resolves a member's full reporting chain: every ancestor unit from the
 * workspace root down to the member's own unit (inclusive), using the
 * ancestor_ids array maintained by the DB triggers.
 */
export async function fetchMemberUnitLineage(
  memberId: string
): Promise<{ data: MemberUnitLineage | null; error: Error | null }> {
  const cleanId = (memberId || '').trim()
  if (!isUuid(cleanId)) {
    return { data: null, error: new Error('A valid member id is required.') }
  }

  const supabase = getSupabase()

  const { data: memberRow, error: memberError } = await supabase
    .from('workspace_members')
    .select('id, unit_id, reports_to, job_title')
    .eq('id', cleanId)
    .maybeSingle()

  if (memberError) {
    console.warn('[organizationMemberService] Member fetch failed:', memberError.message)
    return { data: null, error: new Error(memberError.message) }
  }
  if (!memberRow) {
    return { data: null, error: new Error('Member not found.') }
  }

  const assigned = memberRow as unknown as MemberAssignmentRow
  const base: MemberAssignment = {
    memberId: assigned.id,
    unitId: assigned.unit_id,
    reportsTo: assigned.reports_to,
    jobTitle: assigned.job_title,
  }

  if (!assigned.unit_id) {
    return { data: { ...base, lineage: [] }, error: null }
  }

  const { data: unitRow, error: unitError } = await supabase
    .from('organization_units')
    .select('*')
    .eq('id', assigned.unit_id)
    .maybeSingle()

  if (unitError) {
    return { data: null, error: new Error(unitError.message) }
  }
  if (!unitRow) {
    // Unit row missing (stale unit_id) - treat as unassigned rather than fail.
    return { data: { ...base, lineage: [] }, error: null }
  }

  const unit = unitRow as unknown as OrganizationUnitRow
  const ancestorIds = Array.isArray(unit.ancestor_ids) ? unit.ancestor_ids : []
  if (ancestorIds.length === 0) {
    return { data: { ...base, lineage: [mapUnitRow(unit)] }, error: null }
  }

  const { data: ancestorRows, error: ancestorsError } = await supabase
    .from('organization_units')
    .select('*')
    .in('id', ancestorIds)
    .order('path')

  if (ancestorsError) {
    return { data: null, error: new Error(ancestorsError.message) }
  }

  const rows = (ancestorRows ?? []) as unknown as OrganizationUnitRow[]
  return { data: { ...base, lineage: rows.map(mapUnitRow) }, error: null }
}

/**
 * All member IDs a leader has authority over (self + every unit they head +
 * every subordinate unit), via the get_subordinate_member_ids RPC.
 * Returns an empty list on failure - callers must treat that as "no scope".
 */
export async function fetchSubordinateMemberIds(leaderMemberId: string): Promise<string[]> {
  const cleanId = (leaderMemberId || '').trim()
  if (!isUuid(cleanId)) return []

  const supabase = getSupabase()
  const { data, error } = await supabase.rpc('get_subordinate_member_ids', {
    p_leader_member_id: cleanId,
  })

  if (error) {
    console.warn('[organizationMemberService] Subordinate RPC failed:', error.message)
    return []
  }

  return ((data ?? []) as unknown as { member_id: string }[]).map((row) => row.member_id)
}

/**
 * True when the manager has hierarchical or direct-supervisor authority over
 * the target member, via the can_manage_member RPC. Fails closed (false).
 */
export async function canManageMember(
  managerMemberId: string,
  targetMemberId: string
): Promise<boolean> {
  const cleanManagerId = (managerMemberId || '').trim()
  const cleanTargetId = (targetMemberId || '').trim()
  if (!isUuid(cleanManagerId) || !isUuid(cleanTargetId)) return false

  const supabase = getSupabase()
  const { data, error } = await supabase.rpc('can_manage_member', {
    p_manager_member_id: cleanManagerId,
    p_target_member_id: cleanTargetId,
  })

  if (error) {
    console.warn('[organizationMemberService] Authority RPC failed:', error.message)
    return false
  }

  return Boolean(data)
}