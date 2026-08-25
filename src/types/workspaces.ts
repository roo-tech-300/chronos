export type WorkspaceRole = 'admin' | 'hod' | 'staff' | 'member' | 'owner'

export interface Workspace {
  id: string
  name: string
  slug: string
  plan: 'enterprise' | 'pro' | 'starter' | 'free'
  role: WorkspaceRole
  memberCount: number
  kioskCount: number
  avatarUrl?: string
  accentColor?: string
  logo?: string
  status?: 'active' | 'pending' | 'suspended'
  createdAt?: string
}

export interface WorkspaceMember {
  id: string
  workspaceId: string
  userId: string
  role: WorkspaceRole
  createdAt: string
  userEmail?: string
  userFullName?: string
}
