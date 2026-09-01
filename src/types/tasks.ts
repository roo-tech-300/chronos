export type TaskType = 'recurring' | 'special'
export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskStatus = 'not_done' | 'submitted' | 'approved'

export interface TaskRow {
  id: string
  workspace_id: string
  title: string
  description: string
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  assignee_member_id: string
  department: string
  sub_department: string
  recurrence: string | null
  due_date: string
  is_today: boolean
  estimated_mins: number
  actual_mins: number | null
  completed_at: string | null
  verified_by: string | null
  proof_note: string | null
  difficulty_note: string | null
  completion_links: string[]
  created_at: string
  updated_at: string
}

export interface TaskItem {
  id: string
  title: string
  description: string
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  assigneeName: string
  assigneeRole: string
  assigneeMemberId?: string
  assigneeAvatar?: string
  department: string
  subDepartment: string
  recurrence?: string
  dueDate: string
  isToday?: boolean
  estimatedMins?: number
  actualMins?: number
  completedAt?: string
  verifiedBy?: string
  proofNote?: string
  difficultyNote?: string
  completionLinks?: string[]
}

export interface StaffTaskGroup {
  name: string
  role: string
  subDepartment: string
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
  priority: TaskPriority
  assigneeMemberId: string
  assigneeName?: string
  assigneeRole?: string
  department: string
  subDepartment?: string
  recurrence?: string
  dueDate: string
  isToday?: boolean
  estimatedMins?: number
}

export interface TaskSubmissionPayload {
  completionNote: string
  completionLinks?: string[]
  actualMins: number
  difficultyNote?: string
}

export interface TaskFilters {
  status?: TaskStatus | 'all'
  type?: TaskType | 'all'
  department?: string | 'all'
  assigneeMemberId?: string
  searchQuery?: string
  onlyToday?: boolean
}
