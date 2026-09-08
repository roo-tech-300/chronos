import type { OrganizationUnitMember } from './organization'

export type TaskType = 'recurring' | 'special'
export type TaskStatus = 'not_done' | 'submitted' | 'approved'

export interface TaskRow {
  id: string
  workspace_id: string
  title: string
  description: string
  type: TaskType
  status: TaskStatus
  assignee_member_id: string
  department: string
  recurrence: string | null
  due_date: string
  completed_at: string | null
  verified_by: string | null
  proof_note: string | null
  created_at: string
  updated_at: string
}

export interface TaskItem {
  id: string
  title: string
  description: string
  type: TaskType
  status: TaskStatus
  assigneeName: string
  assigneeRole: string
  assigneeMemberId?: string
  assigneeAvatar?: string
  department: string
  recurrence?: string
  dueDate: string
  completedAt?: string
  verifiedBy?: string
  proofNote?: string
}

export interface StaffTaskGroup {
  name: string
  role: string
  initials: string
  isLead?: boolean
  leadsSubDepartment?: string
  tasks: TaskItem[]
}

export interface CreateTaskInput {
  workspaceId: string
  title: string
  description?: string
  type: TaskType
  assigneeMemberId: string
  assigneeName?: string
  assigneeRole?: string
  department: string
  recurrence?: string
  dueDate: string
}

export interface TaskSubmissionPayload {
  completionNote: string
}

export interface TaskFilters {
  status?: TaskStatus | 'all'
  type?: TaskType | 'all'
  department?: string | 'all'
  unit?: string | 'all'
  assigneeMemberId?: string
  searchQuery?: string
}

/**
 * A real workspace member resolved from Supabase (workspace_members + profiles).
 * Used as the single source of truth for staff identity on the tasks screens.
 */
export interface WorkspaceMemberRecord {
  /** workspace_members.id - the canonical id referenced by tasks.assignee_member_id */
  memberId: string
  /** auth.users.id linked through workspace_members.user_id (when present) */
  userId?: string
  /** Display name resolved from profiles (never a fabricated placeholder) */
  name: string
  email?: string
  avatarUrl?: string
  /** Raw DB role value (owner | admin | hod | editor | staff | member ...) */
  role?: string
  /** Human-readable role label derived from the raw role */
  roleLabel: string
  /** workspace_members.department value ('General Staff' when unset) */
  department: string
  /** organization_units.id this member is placed in (null when unassigned) */
  unitId?: string
  /** All unit IDs this member belongs to (primary and secondary) */
  unitIds?: string[]
  /** Detailed assignments to organization units */
  assignments?: OrganizationUnitMember[]
  /** workspace_members.job_title */
  jobTitle?: string
}
