export type WorkspaceRole = 'admin' | 'hod' | 'staff' | 'member' | 'owner'

export interface Workspace {
  id: string
  name: string
  slug: string
  plan: 'enterprise' | 'pro' | 'starter' | 'free'
  role: WorkspaceRole
  memberCount: number
  kioskCount: number
  category?: string
  avatarUrl?: string
  accentColor?: string
  logo?: string
  status?: 'active' | 'pending' | 'suspended'
  createdAt?: string
  joinCode?: string
}

export interface WorkspaceMember {
  id: string
  workspaceId: string
  userId: string
  role: WorkspaceRole
  department?: string
  createdAt: string
  userEmail?: string
  userFullName?: string
}

export interface WorkspaceDraft {
  name: string
  category: string
  accentColor: string
  avatarUrl?: string
}


/** Status of a join request */
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected'

/** A pending or resolved request to join a workspace */
export interface WorkspaceJoinRequest {
  id: string
  workspaceId: string
  userId: string
  workspaceName?: string
  userFullName?: string
  userEmail?: string
  requestMessage?: string | null
  status: JoinRequestStatus
  requestedAt: string | null
  reviewedAt: string | null
  reviewerId: string | null
}
