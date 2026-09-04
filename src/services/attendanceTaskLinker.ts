import { getSupabase } from '../lib/supabase'

export interface MemberTaskBrief {
  totalTasks: number
  openTasks: number
  highPriorityTasks: number
}

export async function getMemberTodayTaskBrief(
  memberId: string,
  workspaceId?: string
): Promise<MemberTaskBrief> {
  try {
    const supabase = getSupabase()
    let query = supabase
      .from('tasks')
      .select('id, priority, status, is_today')
      .eq('assignee_member_id', memberId)

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    const { data, error } = await query
    if (error || !data) {
      return { totalTasks: 0, openTasks: 0, highPriorityTasks: 0 }
    }

    const totalTasks = data.length
    const openTasks = data.filter((t) => t.status !== 'approved').length
    const highPriorityTasks = data.filter(
      (t) => t.priority === 'high' && t.status !== 'approved'
    ).length

    return {
      totalTasks,
      openTasks,
      highPriorityTasks,
    }
  } catch (err) {
    console.warn('[TaskLinker] Failed to query member task brief:', err)
    return { totalTasks: 0, openTasks: 0, highPriorityTasks: 0 }
  }
}
