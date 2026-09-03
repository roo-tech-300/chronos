import { getSupabase } from '../lib/supabase'
import { isRealWorkspaceUuid } from '../utils/uuid'
import type {
  TaskItem,
  TaskRow,
  TaskFilters,
  CreateTaskInput,
  TaskSubmissionPayload,
} from '../types/tasks'

/**
 * Maps a Supabase tasks row + joined workspace_members / profiles into UI TaskItem model.
 */
function mapTaskRowToItem(row: TaskRow & { workspace_members?: { id: string; role?: string; profiles?: { full_name?: string; avatar_url?: string; email?: string } } }): TaskItem {
  const member = row.workspace_members
  const profile = member?.profiles

  const assigneeName = profile?.full_name || profile?.email || 'Unassigned Staff'
  const assigneeRole = member?.role || 'Staff Member'
  const assigneeAvatar = profile?.avatar_url || ''

  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    type: row.type,
    priority: row.priority,
    status: row.status,
    assigneeName,
    assigneeRole,
    assigneeMemberId: row.assignee_member_id,
    assigneeAvatar,
    department: row.department,
    subDepartment: row.sub_department || '',
    recurrence: row.recurrence || undefined,
    dueDate: row.due_date,
    isToday: row.is_today,
    estimatedMins: row.estimated_mins || 30,
    actualMins: row.actual_mins ?? undefined,
    completedAt: row.completed_at || undefined,
    verifiedBy: row.verified_by || undefined,
    proofNote: row.proof_note || undefined,
    difficultyNote: row.difficulty_note || undefined,
    completionLinks: Array.isArray(row.completion_links) ? row.completion_links : [],
  }
}

/**
 * 1. Fetches workspace tasks joined with member profiles from Supabase.
 * Returns actual database results only - no fallback to dummy data.
 */
export async function fetchWorkspaceTasks(
  workspaceId: string,
  filters?: TaskFilters
): Promise<TaskItem[]> {
  const cleanId = (workspaceId || '').trim().toLowerCase()
  const supabase = getSupabase()

  if (!isRealWorkspaceUuid(cleanId)) {
    return []
  }

  try {
    let query = supabase
      .from('tasks')
      .select('*, workspace_members(id, role, profiles(full_name, avatar_url, email))')
      .eq('workspace_id', cleanId)
      .order('due_date', { ascending: false })

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }
    if (filters?.type && filters.type !== 'all') {
      query = query.eq('type', filters.type)
    }
    if (filters?.department && filters.department !== 'all') {
      query = query.eq('department', filters.department)
    }
    if (filters?.assigneeMemberId) {
      query = query.eq('assignee_member_id', filters.assigneeMemberId)
    }
    if (filters?.onlyToday) {
      query = query.eq('is_today', true)
    }

    const { data, error } = await query

    if (error) {
      console.warn('[taskService] Supabase fetch error:', error.message)
      return []
    }

    // Return actual database results even if empty - don't fall back to dummy data
    if (!data || data.length === 0) {
      return []
    }

    const mapped = data.map(mapTaskRowToItem)
    if (filters?.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim()
      return mapped.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.assigneeName.toLowerCase().includes(q)
      )
    }

    return mapped
  } catch (err) {
    console.warn('[taskService] Error fetching tasks:', err)
    return []
  }
}

/**
 * 2. Fetches assigned tasks for a specific member (e.g. My Day / Staff Workspace).
 */
export async function fetchMemberTasks(
  memberId: string,
  options?: { onlyToday?: boolean }
): Promise<TaskItem[]> {
  const cleanMemberId = (memberId || '').trim()
  const supabase = getSupabase()

  if (!cleanMemberId) {
    return []
  }

  try {
    let query = supabase
      .from('tasks')
      .select('*, workspace_members(id, role, profiles(full_name, avatar_url, email))')
      .eq('assignee_member_id', cleanMemberId)
      .order('due_date', { ascending: false })

    if (options?.onlyToday) {
      query = query.eq('is_today', true)
    }

    const { data, error } = await query

    // Return actual database results even if empty - don't fall back to dummy data
    if (error || !data || data.length === 0) {
      if (error) {
        console.warn('[taskService] Error in fetchMemberTasks:', error.message)
      }
      return []
    }

    return data.map(mapTaskRowToItem)
  } catch (err) {
    console.warn('[taskService] Error in fetchMemberTasks:', err)
    return []
  }
}

/**
 * 3. Inserts a batch of new task assignments into Supabase.
 */
export async function createTaskBatch(
  workspaceId: string,
  tasks: CreateTaskInput[]
): Promise<{ success: boolean; data?: TaskItem[]; error?: string }> {
  const cleanId = (workspaceId || '').trim().toLowerCase()
  const supabase = getSupabase()

  if (tasks.length === 0) {
    return { success: true, data: [] }
  }

  const rows = tasks.map((t) => ({
    workspace_id: cleanId,
    title: t.title,
    description: t.description || '',
    type: t.type,
    priority: t.priority,
    status: 'not_done' as const,
    assignee_member_id: t.assigneeMemberId,
    department: t.department,
    sub_department: t.subDepartment || '',
    recurrence: t.recurrence || null,
    due_date: t.dueDate,
    is_today: t.isToday ?? true,
    estimated_mins: t.estimatedMins || 30,
    completion_links: [],
  }))

  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert(rows)
      .select('*, workspace_members(id, role, profiles(full_name, avatar_url, email))')

    if (error) {
      console.warn('[taskService] Failed to insert task batch:', error.message)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: (data || []).map(mapTaskRowToItem),
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown database error'
    return { success: false, error: errorMsg }
  }
}

/**
 * 4. Submits task completion with proof notes, actual minutes, and evidence links.
 */
export async function submitTaskCompletion(
  taskId: string,
  payload: TaskSubmissionPayload
): Promise<{ success: boolean; data?: TaskItem; error?: string }> {
  const cleanTaskId = (taskId || '').trim()
  const supabase = getSupabase()

  const updateFields = {
    status: 'submitted' as const,
    proof_note: payload.completionNote || null,
    difficulty_note: payload.difficultyNote || null,
    actual_mins: payload.actualMins || 0,
    completion_links: payload.completionLinks || [],
    completed_at: new Date().toISOString(),
  }

  try {
    const { data, error } = await supabase
      .from('tasks')
      .update(updateFields)
      .eq('id', cleanTaskId)
      .select('*, workspace_members(id, role, profiles(full_name, avatar_url, email))')
      .maybeSingle()

    if (error) {
      console.warn('[taskService] Failed to submit task completion:', error.message)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: data ? mapTaskRowToItem(data) : undefined,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown submission error'
    return { success: false, error: errorMsg }
  }
}

/**
 * 5. Approves a submitted task with verifier name and timestamp.
 */
export async function approveTask(
  taskId: string,
  verifiedBy: string
): Promise<{ success: boolean; data?: TaskItem; error?: string }> {
  const cleanTaskId = (taskId || '').trim()
  const supabase = getSupabase()

  const updateFields = {
    status: 'approved' as const,
    verified_by: verifiedBy || 'HOD / Manager',
    updated_at: new Date().toISOString(),
  }

  try {
    const { data, error } = await supabase
      .from('tasks')
      .update(updateFields)
      .eq('id', cleanTaskId)
      .select('*, workspace_members(id, role, profiles(full_name, avatar_url, email))')
      .maybeSingle()

    if (error) {
      console.warn('[taskService] Failed to approve task:', error.message)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: data ? mapTaskRowToItem(data) : undefined,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown approval error'
    return { success: false, error: errorMsg }
  }
}


