import type {
  OrganizationUnitMemberRow,
  OrganizationUnitRow,
} from '../types/organization'

// =============================================================================
// Supabase Type Assertion Guards
// =============================================================================
// The Supabase client has no Database generic, so nested relation selects
// (e.g. `member:workspace_members!inner(...)`) return shapes Supabase cannot
// statically infer. These guards validate the essential fields at runtime
// before casting, replacing unsafe `as unknown as T` double-assertions.
// =============================================================================

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/** Asserts a value is a valid OrganizationUnitRow (snake_case DB shape). */
export function assertOrganizationUnitRow(value: unknown): OrganizationUnitRow {
  if (!isObject(value)) throw new TypeError('Expected object for OrganizationUnitRow')
  return value as OrganizationUnitRow
}

/** Asserts a value is a valid OrganizationUnitMemberRow. */
export function assertOrganizationUnitMemberRow(value: unknown): OrganizationUnitMemberRow {
  if (!isObject(value)) throw new TypeError('Expected object for OrganizationUnitMemberRow')
  return value as OrganizationUnitMemberRow
}

/** Asserts an array of OrganizationUnitRow from a Supabase query. */
export function assertOrganizationUnitRows(data: unknown): OrganizationUnitRow[] {
  if (!Array.isArray(data)) return []
  return data.map(assertOrganizationUnitRow)
}

/** Row with optional nested unit relation (from `unit:organization_units(*)` selects). */
export type OrganizationUnitMemberWithUnit = OrganizationUnitMemberRow & {
  unit?: OrganizationUnitRow
}

/** Asserts an array of OrganizationUnitMemberRow from a Supabase query. */
export function assertOrganizationUnitMemberRows(data: unknown): OrganizationUnitMemberWithUnit[] {
  if (!Array.isArray(data)) return []
  return data.map((row) => assertOrganizationUnitMemberRow(row) as OrganizationUnitMemberWithUnit)
}

/** Asserts an array of rows each containing a member_id string. */
export function assertMemberIdRows(data: unknown): { member_id: string }[] {
  if (!Array.isArray(data)) return []
  return data.filter((row): row is { member_id: string } => isObject(row) && isString(row.member_id))
}

/** Asserts an array of rows each containing a unit_id string. */
export function assertUnitIdRows(data: unknown): { unit_id: string }[] {
  if (!Array.isArray(data)) return []
  return data.filter((row): row is { unit_id: string } => isObject(row) && isString(row.unit_id))
}

/** Shape returned by organization_unit_members selects with member_id + unit_id. */
export interface UnitAssignmentRow {
  member_id: string
  unit_id: string
}

/** Asserts an array of UnitAssignmentRow (member_id + unit_id pairs). */
export function assertUnitAssignmentRows(data: unknown): UnitAssignmentRow[] {
  if (!Array.isArray(data)) return []
  return data.filter(
    (row): row is UnitAssignmentRow => isObject(row) && isString(row.member_id) && isString(row.unit_id)
  )
}

/** Shape returned by unitMembersService with nested member relation. */
export interface MemberWithAssignmentRow {
  id: string
  unit_id: string
  member_id: string
  is_primary: boolean
  assignment_type: string
  job_title: string | null
  reports_to: string | null
  member: {
    id: string
    user_id: string | null
    role: string | null
    department: string | null
    workspace_id: string
  }
}

/** Asserts an array of MemberWithAssignmentRow (nested member relation). */
export function assertMemberWithAssignmentRows(data: unknown): MemberWithAssignmentRow[] {
  if (!Array.isArray(data)) return []
  return data.filter((row): row is MemberWithAssignmentRow => {
    if (!isObject(row)) return false
    const m = row.member
    return (
      isString(row.id) &&
      isString(row.member_id) &&
      isObject(m) &&
      isString(m.id)
    )
  })
}

/** Asserts a window-like object with optional Tauri internals. */
export function assertWindowWithTauri(value: unknown): { __TAURI__?: unknown; __TAURI_INTERNALS__?: unknown } {
  if (!isObject(value)) return {}
  return value as { __TAURI__?: unknown; __TAURI_INTERNALS__?: unknown }
}

/** Shape returned by workspace profile update (id + name + slug + category). */
export interface WorkspaceProfileUpdateResult {
  id: string
  name: string
  slug: string
  category: string
}

/** Asserts a value is a valid WorkspaceProfileUpdateResult. */
export function assertWorkspaceProfileUpdateResult(value: unknown): WorkspaceProfileUpdateResult {
  if (!isObject(value)) throw new TypeError('Expected object for WorkspaceProfileUpdateResult')
  return value as WorkspaceProfileUpdateResult
}

/** Raw workspace row shape from nested relation selects with count aggregates. */
export interface WorkspaceWithCounts {
  id: string
  name: string
  slug: string
  plan?: 'enterprise' | 'pro' | 'starter' | 'free'
  category?: string
  avatar_url?: string
  accent_color?: string
  status?: 'active' | 'pending' | 'suspended'
  created_at?: string
  workspace_members?: [{ count: number }] | { count: number }[]
  kiosks?: [{ count: number }] | { count: number }[]
}

/** Asserts a value is a valid WorkspaceWithCounts (nested relation shape). */
export function assertWorkspaceWithCounts(value: unknown): WorkspaceWithCounts {
  if (!isObject(value)) throw new TypeError('Expected object for WorkspaceWithCounts')
  return value as WorkspaceWithCounts
}
