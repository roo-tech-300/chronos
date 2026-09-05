import { getSupabase } from '../lib/supabase'
import { isUuid } from '../utils/uuid'
import type {
  MemberAssignment,
  MemberUnitLineage,
  OrganizationUnitMember,
  OrganizationUnitMemberRow,
  OrgUnit,
} from '../types/organization'
import { mapUnitRow } from './organizationUnitService'
import {
  assertOrganizationUnitMemberRows,
  assertOrganizationUnitRow,
  assertOrganizationUnitRows,
} from '../utils/supabaseTypeGuards'

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

  const items = assertOrganizationUnitMemberRows(data).map(
    (row) => {
      const unit = row.unit ? mapUnitRow(row.unit) : undefined
      return mapUnitMemberRow(row, unit)
    }
  )

  return { data: items, error: null }
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

  const unit = assertOrganizationUnitRow(unitRow)
  const ancestorIds = Array.isArray(unit.ancestor_ids) ? unit.ancestor_ids : []
  const { data: ancestorRows } = await supabase
    .from('organization_units')
    .select('*')
    .in('id', ancestorIds)
    .order('path')

  const lineage = assertOrganizationUnitRows(ancestorRows).map(mapUnitRow)
  const allAssignedUnits = assignments.map((a) => a.unit).filter(Boolean) as OrgUnit[]

  return { data: { ...base, lineage, allAssignedUnits }, error: null }
}
