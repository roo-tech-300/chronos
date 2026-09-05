import { getSupabase } from '../lib/supabase'
import { isUuid } from '../utils/uuid'

export interface MemberTaskBrief {
  totalTasks: number
  openTasks: number
  highPriorityTasks: number
}

const EMPTY_BRIEF: MemberTaskBrief = {
  totalTasks: 0,
  openTasks: 0,
  highPriorityTasks: 0,
}

interface TaskBriefRpcRow {
  total_tasks?: number | string | null
  open_tasks?: number | string | null
  high_priority_tasks?: number | string | null
}

function toBrief(row: TaskBriefRpcRow | undefined): MemberTaskBrief {
  if (!row) return EMPTY_BRIEF
  return {
    totalTasks: Number(row.total_tasks) || 0,
    openTasks: Number(row.open_tasks) || 0,
    highPriorityTasks: Number(row.high_priority_tasks) || 0,
  }
}

/**
 * Aggregated "today" task brief for a scanned member (counts only, no PII).
 *
 * Paired kiosks run on the anon key with no user session, so the direct
 * `tasks` query (authenticated-only RLS) is rejected. When a kiosk device
 * token is available, the SECURITY DEFINER RPC `get_member_task_brief` is
 * used instead: it validates the token against `kiosks` and returns aggregate
 * counts only. Authenticated dashboard contexts fall back to the direct
 * query, scoped to today's assignments (is_today) via RLS.
 */
export async function getMemberTodayTaskBrief(
  memberId: string,
  workspaceId?: string,
  deviceToken?: string
): Promise<MemberTaskBrief> {
  try {
    const supabase = getSupabase()
    const cleanMemberId = (memberId || '').trim()
    const cleanWorkspaceId = (workspaceId || '').trim()

    // Kiosk path: device-token-validated RPC returning display-safe counts.
    if (deviceToken) {
      if (!isUuid(cleanMemberId) || !isUuid(cleanWorkspaceId)) return EMPTY_BRIEF
      const { data, error } = await supabase.rpc('get_member_task_brief', {
        p_member_id: cleanMemberId,
        p_workspace_id: cleanWorkspaceId,
        p_device_token: deviceToken,
      })
      if (error) {
        console.warn('[TaskLinker] Task brief RPC failed:', error.message)
        return EMPTY_BRIEF
      }
      return toBrief((data ?? [])[0])
    }

    // Authenticated path: direct query scoped to today's assignments.
    let query = supabase
      .from('tasks')
      .select('id, priority, status')
      .eq('assignee_member_id', cleanMemberId)
      .eq('is_today', true)

    if (cleanWorkspaceId) {
      query = query.eq('workspace_id', cleanWorkspaceId)
    }

    const { data, error } = await query
    if (error || !data) {
      return EMPTY_BRIEF
    }

    const totalTasks = data.length
    const openTasks = data.filter((t) => t.status !== 'approved').length
    const highPriorityTasks = data.filter(
      (t) => t.priority === 'high' && t.status !== 'approved'
    ).length

    return { totalTasks, openTasks, highPriorityTasks }
  } catch (err) {
    console.warn('[TaskLinker] Failed to query member task brief:', err)
    return EMPTY_BRIEF
  }
}

