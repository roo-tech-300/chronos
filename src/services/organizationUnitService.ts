import { getSupabase } from '../lib/supabase'
import { isRealWorkspaceUuid, isUuid } from '../utils/uuid'
import type { PostgrestError } from '@supabase/supabase-js'
import type {
  OrgUnit,
  OrganizationUnitRow,
  CreateUnitInput,
  UpdateUnitInput,
} from '../types/organization'

/**
 * Maps a raw organization_units row into the UI model. The ltree path arrives
 * as a plain string and uuid[] as string[] over PostgREST JSON.
 */
export function mapUnitRow(row: OrganizationUnitRow): OrgUnit {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    parentId: row.parent_id,
    name: row.name,
    code: row.code,
    unitType: row.unit_type,
    headMemberId: row.head_member_id,
    path: row.path,
    ancestorIds: Array.isArray(row.ancestor_ids) ? row.ancestor_ids : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Translates Postgres/PostgREST failures into user-friendly messages.
 * 23505 = duplicate (workspace_id, code); 42501 = RLS rejection.
 */
function translateUnitError(error: PostgrestError | null, fallback: string): Error {
  if (error?.code === '23505') {
    return new Error('A unit with this code already exists in this workspace. Choose a different code.')
  }
  if (error?.code === '42501') {
    return new Error('Only workspace owners and admins can manage organization units.')
  }
  return new Error(error?.message || fallback)
}

/**
 * Fetches every organization unit in a workspace, ordered by ltree path.
 * That ordering is naturally root-first, depth-first, so the UI can render
 * the tree or breadcrumbs straight from the flat list.
 */
export async function fetchWorkspaceUnits(
  workspaceId: string
): Promise<{ data: OrgUnit[]; error: Error | null }> {
  const cleanId = (workspaceId || '').trim()
  if (!isRealWorkspaceUuid(cleanId)) {
    return { data: [], error: null }
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('organization_units')
    .select('*')
    .eq('workspace_id', cleanId)
    .order('path')

  if (error) {
    console.warn('[organizationUnitService] Workspace units fetch failed:', error.message)
    return { data: [], error: new Error(error.message) }
  }

  const rows = (data ?? []) as unknown as OrganizationUnitRow[]
  return { data: rows.map(mapUnitRow), error: null }
}

/**
 * Fetches one unit plus all of its descendants via the get_unit_subtree_ids
 * RPC (PostgREST cannot express ltree "path <@" operators directly).
 */
export async function fetchUnitSubtree(
  unitId: string
): Promise<{ data: OrgUnit[]; error: Error | null }> {
  const cleanId = (unitId || '').trim()
  if (!isUuid(cleanId)) {
    return { data: [], error: new Error('A valid unit id is required.') }
  }

  const supabase = getSupabase()
  const { data: subtreeIds, error: rpcError } = await supabase.rpc('get_unit_subtree_ids', {
    p_unit_id: cleanId,
  })

  if (rpcError) {
    console.warn('[organizationUnitService] Subtree RPC failed:', rpcError.message)
    return { data: [], error: new Error(rpcError.message) }
  }

  const ids = ((subtreeIds ?? []) as unknown as { unit_id: string }[]).map((row) => row.unit_id)
  if (ids.length === 0) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('organization_units')
    .select('*')
    .in('id', ids)
    .order('path')

  if (error) {
    console.warn('[organizationUnitService] Subtree fetch failed:', error.message)
    return { data: [], error: new Error(error.message) }
  }

  const rows = (data ?? []) as unknown as OrganizationUnitRow[]
  return { data: rows.map(mapUnitRow), error: null }
}

/**
 * Creates a unit. The DB trigger derives path/ancestor_ids from the parent,
 * so the client never sends lineage data.
 */
export async function createOrganizationUnit(
  input: CreateUnitInput
): Promise<{ data: OrgUnit | null; error: Error | null }> {
  const cleanWorkspaceId = (input.workspaceId || '').trim()
  if (!isRealWorkspaceUuid(cleanWorkspaceId)) {
    return { data: null, error: new Error('Select a valid workspace before creating a unit.') }
  }

  const name = (input.name || '').trim()
  const code = (input.code || '').trim()
  if (!name) return { data: null, error: new Error('Unit name is required.') }
  if (!code) return { data: null, error: new Error('Unit code is required (e.g. "CS", "IOT").') }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('organization_units')
    .insert({
      workspace_id: cleanWorkspaceId,
      name,
      code,
      unit_type: input.unitType ?? 'department',
      parent_id: input.parentId ?? null,
      head_member_id: input.headMemberId ?? null,
    })
    .select('*')
    .single()

  if (error || !data) {
    return { data: null, error: translateUnitError(error, 'Failed to create the unit.') }
  }

  return { data: mapUnitRow(data as unknown as OrganizationUnitRow), error: null }
}

/**
 * Updates a unit (rename, recode, re-type, move under a new parent, or change
 * its head). Moving/recoding cascades path recomputation to every descendant
 * via the DB triggers.
 */
export async function updateOrganizationUnit(
  unitId: string,
  updates: UpdateUnitInput
): Promise<{ data: OrgUnit | null; error: Error | null }> {
  const cleanId = (unitId || '').trim()
  if (!isUuid(cleanId)) {
    return { data: null, error: new Error('A valid unit id is required.') }
  }

  const payload: Partial<OrganizationUnitRow> = {}
  if (updates.name !== undefined) {
    const name = updates.name.trim()
    if (!name) return { data: null, error: new Error('Unit name is required.') }
    payload.name = name
  }
  if (updates.code !== undefined) {
    const code = updates.code.trim()
    if (!code) return { data: null, error: new Error('Unit code is required.') }
    payload.code = code
  }
  if (updates.unitType !== undefined) payload.unit_type = updates.unitType
  if (updates.parentId !== undefined) payload.parent_id = updates.parentId
  if (updates.headMemberId !== undefined) payload.head_member_id = updates.headMemberId

  if (Object.keys(payload).length === 0) {
    return { data: null, error: new Error('No changes were provided.') }
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('organization_units')
    .update(payload)
    .eq('id', cleanId)
    .select('*')
    .single()

  if (error || !data) {
    return { data: null, error: translateUnitError(error, 'Failed to update the unit.') }
  }

  return { data: mapUnitRow(data as unknown as OrganizationUnitRow), error: null }
}

/**
 * Deletes a unit. The DB cascades to the whole subtree (parent_id ON DELETE
 * CASCADE) - callers must confirm with the user first. Returns the number of
 * primary rows deleted (0 also means "blocked by RLS or not found").
 */
export async function deleteOrganizationUnit(
  unitId: string
): Promise<{ data: number; error: Error | null }> {
  const cleanId = (unitId || '').trim()
  if (!isUuid(cleanId)) {
    return { data: 0, error: new Error('A valid unit id is required.') }
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('organization_units')
    .delete()
    .eq('id', cleanId)
    .select('id')

  if (error) {
    return { data: 0, error: translateUnitError(error, 'Failed to delete the unit.') }
  }

  const deletedCount = Array.isArray(data) ? data.length : 0
  if (deletedCount === 0) {
    return {
      data: 0,
      error: new Error('Unit not found or you do not have permission to delete it.'),
    }
  }

  return { data: deletedCount, error: null }
}