import { getSupabase } from '../lib/supabase'
import { isUuid } from '../utils/uuid'
import type { PostgrestError } from '@supabase/supabase-js'
import type {
  AssignMemberInput,
  MemberAssignment,
  MemberUnitLineage,
  OrganizationUnitMember,
  OrganizationUnitMemberRow,
  OrganizationUnitRow,
  OrgUnit,
} from '../types/organization'
import { mapUnitRow } from './organizationUnitService'

export { fetchSubordinateMemberIds, canManageMember } from './organizationAuthorityService'

function translateMemberError(error: PostgrestError | null, fallback: string): Error {
  if (error?.code === '42501') {
    return new Error('Only workspace owners and admins can re-assign members.')
  }
  return new Error(error?.message || fallback)
}

export function mapUnitMemberRow(
  row: OrganizationUnitMemberRow,
  unit?: OrgUnit
): OrganizationUnitMember {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    unitId: row.unit_id,
    memberId: row.member_id,
    isPrimary: row.is_primary,
    jobTitle: row.job_title,
    assignmentType: row.assignment_type,
    reportsTo: row.reports_to,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    unit,
  }
}

/** Fetches all unit assignments for a member (primary, joint, adjunct, etc.). */
export async function fetchMemberUnitAssignments(
  memberId: string
): Promise<{ data: OrganizationUnitMember[]; error: Error | null }> {
  const cleanId = (memberId || '').trim()
  if (!isUuid(cleanId)) return { data: [], error: new Error('Invalid member id.') }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('organization_unit_members')
    .select('*, unit:organization_units(*)')
    .eq('member_id', cleanId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.warn('[organizationMemberService] Assignments fetch error:', error.message)
    return { data: [], error: new Error(error.message) }
  }

  const items = ((data ?? []) as unknown as (OrganizationUnitMemberRow & { unit?: OrganizationUnitRow })[]).map(
    (row) => {
      const unit = row.unit ? mapUnitRow(row.unit) : undefined
      return mapUnitMemberRow(row, unit)
    }
  )

  return { data: items, error: null }
}

/** Assigns a member to a unit with assignment type and primary status. */
export async function assignMemberToUnit(
  inputOrMemberId: AssignMemberInput | string,
  maybeUnitId?: string,
  maybeReportsTo?: string | null
): Promise<{ data: MemberAssignment | null; error: Error | null }> {
  const input: AssignMemberInput =
    typeof inputOrMemberId === 'string'
      ? {
          memberId: inputOrMemberId,
          unitId: maybeUnitId || '',
          reportsTo: maybeReportsTo,
          isPrimary: true,
          assignmentType: 'primary',
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

  // 2. If assigning as primary, clear primary flag on other assignments first
  if (input.isPrimary) {
    await supabase
      .from('organization_unit_members')
      .update({ is_primary: false })
      .eq('member_id', memberId)
  }

  // 3. Upsert assignment into organization_unit_members
  const { data, error } = await supabase
    .from('organization_unit_members')
    .upsert(
      {
        workspace_id: memberRow.workspace_id,
        member_id: memberId,
        unit_id: unitId,
        is_primary: input.isPrimary ?? false,
        assignment_type: input.assignmentType || 'primary',
        job_title: input.jobTitle !== undefined ? input.jobTitle : memberRow.job_title,
        reports_to: input.reportsTo,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'unit_id,member_id' }
    )
    .select('*')
    .single()

  if (error || !data) {
    return { data: null, error: translateMemberError(error, 'Failed to assign member to unit.') }
  }

  const assigned = data as unknown as OrganizationUnitMemberRow
  return {
    data: {
      memberId: assigned.member_id,
      unitId: assigned.unit_id,
      reportsTo: assigned.reports_to,
      jobTitle: assigned.job_title,
      isPrimary: assigned.is_primary,
      assignmentType: assigned.assignment_type,
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

/** Resolves a member's reporting chain and all assigned units. */
export async function fetchMemberUnitLineage(
  memberId: string
): Promise<{ data: MemberUnitLineage | null; error: Error | null }> {
  const cleanId = (memberId || '').trim()
  if (!isUuid(cleanId)) return { data: null, error: new Error('A valid member id is required.') }

  const supabase = getSupabase()
  const { data: memberRow, error: memberError } = await supabase
    .from('workspace_members')
    .select('id, unit_id, reports_to, job_title')
    .eq('id', cleanId)
    .maybeSingle()

  if (memberError || !memberRow) {
    return { data: null, error: new Error(memberError?.message || 'Member not found.') }
  }

  const base: MemberAssignment = {
    memberId: memberRow.id,
    unitId: memberRow.unit_id,
    reportsTo: memberRow.reports_to,
    jobTitle: memberRow.job_title,
  }

  // Fetch all assignments from junction table
  const { data: assignments } = await fetchMemberUnitAssignments(cleanId)
  base.assignments = assignments

  const activeUnitId = memberRow.unit_id || assignments.find((a) => a.isPrimary)?.unitId
  if (!activeUnitId) {
    return { data: { ...base, lineage: [], allAssignedUnits: [] }, error: null }
  }

  const { data: unitRow } = await supabase
    .from('organization_units')
    .select('*')
    .eq('id', activeUnitId)
    .maybeSingle()

  if (!unitRow) {
    return { data: { ...base, lineage: [], allAssignedUnits: [] }, error: null }
  }

  const unit = unitRow as unknown as OrganizationUnitRow
  const ancestorIds = Array.isArray(unit.ancestor_ids) ? unit.ancestor_ids : []
  const { data: ancestorRows } = await supabase
    .from('organization_units')
    .select('*')
    .in('id', ancestorIds)
    .order('path')

  const lineage = ((ancestorRows ?? []) as unknown as OrganizationUnitRow[]).map(mapUnitRow)
  const allAssignedUnits = assignments.map((a) => a.unit).filter(Boolean) as OrgUnit[]

  return { data: { ...base, lineage, allAssignedUnits }, error: null }
}