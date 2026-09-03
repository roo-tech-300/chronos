import { getSupabase } from '../lib/supabase'
import { isUuid } from '../utils/uuid'
import type { TaskItem, TaskSubmissionPayload } from '../types/tasks'
import { mapTaskRowToItem } from './taskService'

/**
 * Task lifecycle write-actions (member submission + leader approval), split
 * out of taskService to keep both files inside the 250-line house cap.
 * Approval authority is enforced by the approve_task_if_authorized RPC.
 */

/**
 * 4. Submits a member's completion proof for a task (status -> submitted).
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
 * 5. Approves a submitted task via the approve_task_if_authorized RPC, which
 * enforces hierarchy authority (owner/admin or can_manage_member over the
 * assignee) and attributes the approval to the caller's membership.
 * Unauthorized callers get a descriptive error instead of a silent write.
 */
export async function approveTask(
  taskId: string
): Promise<{ success: boolean; data?: TaskItem; error?: string }> {
  const cleanTaskId = (taskId || '').trim()
  if (!isUuid(cleanTaskId)) {
    return { success: false, error: 'A valid task id is required.' }
  }

  const supabase = getSupabase()

  try {
    const { error } = await supabase.rpc('approve_task_if_authorized', {
      p_task_id: cleanTaskId,
    })

    if (error) {
      console.warn('[taskService] Approval failed:', error.message)
      return { success: false, error: error.message }
    }

    // The RPC returns the bare tasks row; re-read it with the assignee join so
    // the caller receives a fully mapped TaskItem.
    const { data: joined, error: joinError } = await supabase
      .from('tasks')
      .select('*, workspace_members(id, role, profiles(full_name, avatar_url, email))')
      .eq('id', cleanTaskId)
      .maybeSingle()

    if (joinError) {
      console.warn('[taskService] Approval re-read failed:', joinError.message)
      return { success: true }
    }

    return {
      success: true,
      data: joined ? mapTaskRowToItem(joined) : undefined,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown approval error'
    return { success: false, error: errorMsg }
  }
}