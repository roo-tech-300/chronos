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
