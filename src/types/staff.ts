export interface StaffMember {
  id: string // workspace_members.id
  userId?: string
  staffCode?: string
  name: string
  email: string
  role: string
  status: 'On-Site' | 'Off-Site'
  department?: string
  avatarUrl?: string
  workspaceId?: string
  createdAt?: string
}

export interface StaffQueryParams {
  workspaceId?: string
  page: number
  pageSize: number
  search?: string
  roleTab?: string
  role?: string
}

export interface PaginatedStaffResponse {
  members: StaffMember[]
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
}
