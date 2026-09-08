import { getSupabase } from '../lib/supabase'
import { isUuid } from '../utils/uuid'
import type { PostgrestError } from '@supabase/supabase-js'
import type {
  AssignMemberInput,
  MemberAssignment,
} from '../types/organization'
import { assertOrganizationUnitMemberRow } from '../utils/supabaseTypeGuards'

export { fetchSubordinateMemberIds, canManageMember } from './organizationAuthorityService'
export {
  fetchMemberUnitAssignments,
  fetchMemberUnitLineage,
  mapUnitMemberRow,
} from './organizationLineageService'

function translateMemberError(error: PostgrestError | null, fallback: string): Error {
  if (error?.code === '42501') {
    return new Error('Only workspace owners and admins can re-assign members.')
  }
  return new Error(error?.message || fallback)
}

/** Assigns a member to a unit. */
export async function assignMemberToUnit(
  inputOrMemberId: AssignMemberInput | string,
  maybeUnitId?: string
): Promise<{ data: MemberAssignment | null; error: Error | null }> {
  const input: AssignMemberInput =
    typeof inputOrMemberId === 'string'
      ? {
          memberId: inputOrMemberId,
          unitId: maybeUnitId || '',
        }
      : inputOrMemberId

  const memberId = (input.memberId || '').trim()
  const unitId = (input.unitId || '').trim()
  if (!isUuid(memberId) || !isUuid(unitId)) {
    return { data: null, error: new Error('Valid member and unit IDs are required.') }
  }

  const supabase = getSupabase()

  // 1. Resolve workspace_id from member
  const { data: memberRow, error: memberErr } = await supabase
    .from('workspace_members')
    .select('workspace_id, job_title')
    .eq('id', memberId)
    .single()

  if (memberErr || !memberRow) {
    return { data: null, error: translateMemberError(memberErr, 'Member not found.') }
  }

    // Upsert assignment into organization_unit_members
  const { data, error } = await supabase
    .from('organization_unit_members')
    .upsert(
      {
        workspace_id: memberRow.workspace_id,
        member_id: memberId,
        unit_id: unitId,
        job_title: input.jobTitle !== undefined ? input.jobTitle : memberRow.job_title,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'unit_id,member_id' }
    )
    .select('*')
    .single()

  if (error || !data) {
    return { data: null, error: translateMemberError(error, 'Failed to assign member to unit.') }
  }

  const assigned = assertOrganizationUnitMemberRow(data)
  return {
    data: {
      memberId: assigned.member_id,
      unitId: assigned.unit_id,
      jobTitle: assigned.job_title,
    },
    error: null,
  }
}

/** Removes a specific unit assignment for a member. */
export async function removeMemberFromUnit(
  memberId: string,
  unitId: string
): Promise<{ success: boolean; error: Error | null }> {
  const cleanMemberId = (memberId || '').trim()
  const cleanUnitId = (unitId || '').trim()
  if (!isUuid(cleanMemberId) || !isUuid(cleanUnitId)) {
    return { success: false, error: new Error('Valid member and unit IDs are required.') }
  }

  const supabase = getSupabase()
  const { error } = await supabase
    .from('organization_unit_members')
    .delete()
    .eq('member_id', cleanMemberId)
    .eq('unit_id', cleanUnitId)

  if (error) {
    return { success: false, error: translateMemberError(error, 'Failed to remove assignment.') }
  }

  return { success: true, error: null }
}
