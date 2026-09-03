export interface HierarchyLevelNaming {
  level: number
  singular: string
  plural: string
}

export interface OrganizationUnit {
  id: string
  workspaceId?: string
  name: string
  code: string
  level: number
  parentId?: string | null
  leadMemberId?: string | null
  leadName: string
  leadRoleTitle: string
  leadEmail?: string
  staffCount: number
  location?: string
  description?: string
  createdAt?: string
  updatedAt?: string
  children: OrganizationUnit[]
}

export type HierarchyNode = OrganizationUnit

export interface PermissionItem {
  id: string
  category: 'tasks' | 'reports' | 'structure' | 'hardware'
  label: string
  description: string
  enabled: boolean
}

export interface OrgRole {
  id: string
  name: string
  description: string
  isSystemDefault?: boolean
  assignedCount: number
  permissions: PermissionItem[]
}

export interface OrganizationProfile {
  id: string
  name: string
  shortName?: string
  slug?: string
  category: string
  deploymentLocation: string
  topLeaderTitle: string
  topLeaderName: string
  levelNamings: HierarchyLevelNaming[]
  hierarchyRoot: HierarchyNode
  roles: OrgRole[]
}

// ---------------------------------------------------------------------------
// Database-backed organization units (public.organization_units)
// ---------------------------------------------------------------------------

export type OrganizationUnitType =
  | 'institution'
  | 'directorate'
  | 'faculty'
  | 'division'
  | 'department'
  | 'unit'
  | 'lab'
  | 'office'

/** Raw organization_units row as returned by Supabase (snake_case). */
export interface OrganizationUnitRow {
  id: string
  workspace_id: string
  parent_id: string | null
  name: string
  code: string
  unit_type: OrganizationUnitType
  head_member_id: string | null
  /** ltree value, serialized as a plain string (e.g. "SICT.CS.IOT") */
  path: string
  /** uuid[] serialized as string[]; includes this unit's own id */
  ancestor_ids: string[]
  created_at: string
  updated_at: string
}

/** UI model for a faculty / department / unit node in the workspace hierarchy. */
export interface OrgUnit {
  id: string
  workspaceId: string
  parentId: string | null
  name: string
  code: string
  unitType: OrganizationUnitType
  headMemberId: string | null
  /** ltree breadcrumb, e.g. "SICT.CS.IOT" */
  path: string
  /** All ancestor unit IDs INCLUDING this unit itself */
  ancestorIds: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateUnitInput {
  workspaceId: string
  name: string
  code: string
  unitType?: OrganizationUnitType
  parentId?: string | null
  headMemberId?: string | null
}

export interface UpdateUnitInput {
  name?: string
  code?: string
  unitType?: OrganizationUnitType
  parentId?: string | null
  headMemberId?: string | null
}

/** Raw workspace_members subset used by member placement queries. */
export interface MemberAssignmentRow {
  id: string
  unit_id: string | null
  reports_to: string | null
  job_title: string | null
}

/** Result of assigning a member to a unit / supervisor. */
export interface MemberAssignment {
  memberId: string
  unitId: string | null
  reportsTo: string | null
  jobTitle: string | null
}

/** A member's reporting chain: workspace root down to their own unit (inclusive). */
export interface MemberUnitLineage extends MemberAssignment {
  lineage: OrgUnit[]
}
