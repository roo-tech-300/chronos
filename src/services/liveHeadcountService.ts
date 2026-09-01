import { getSupabase } from '../lib/supabase'
import { isUuid } from '../utils/uuid'
import { resolveMemberNameMap } from './attendanceReporting'
import type { AttendanceSummary, OnSiteMember } from '../types/attendance'

export interface LiveHeadcountResult {
  summary: AttendanceSummary
  onSiteMembers: OnSiteMember[]
}

/**
 * Aggregates live on-site personnel and attendance status directly from database attendance_logs.
 */
export async function fetchLiveHeadcount(
  workspaceId?: string,
  totalStaffCount = 50
): Promise<LiveHeadcountResult> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const emptySummary: AttendanceSummary = {
    totalExpected: totalStaffCount,
    currentlyOnSite: 0,
    departedToday: 0,
    totalScansToday: 0,
    attendanceRate: 0,
  }

  if (!workspaceId || !isUuid(workspaceId)) {
    return { summary: emptySummary, onSiteMembers: [] }
  }

  try {
    const supabase = getSupabase()
    const { data: logs, error } = await supabase
      .from('attendance_logs')
      .select('id, member_id, terminal_id, direction, scan_timestamp')
      .eq('workspace_id', workspaceId)
      .gte('scan_timestamp', startOfDay.toISOString())
      .order('scan_timestamp', { ascending: false })

    if (error || !logs || logs.length === 0) {
      return { summary: emptySummary, onSiteMembers: [] }
    }

    // Determine the latest scan state for each distinct member today
    const latestScanByMember = new Map<
      string,
      { id: string; memberId: string; terminalId: string; direction: string; scanTimestamp: string }
    >()

    logs.forEach((row) => {
      if (!latestScanByMember.has(row.member_id)) {
        latestScanByMember.set(row.member_id, {
          id: row.id,
          memberId: row.member_id,
          terminalId: row.terminal_id,
          direction: row.direction,
          scanTimestamp: row.scan_timestamp,
        })
      }
    })

    const onSiteRows: Array<{ id: string; memberId: string; terminalId: string; scanTimestamp: string }> = []
    let departedCount = 0

    latestScanByMember.forEach((scan) => {
      if (scan.direction === 'in') {
        onSiteRows.push(scan)
      } else if (scan.direction === 'out') {
        departedCount++
      }
    })

    // Resolve human names and profile metadata
    const onSiteMemberIds = onSiteRows.map((r) => r.memberId)
    const profileMap = await resolveMemberNameMap(onSiteMemberIds)

    const onSiteMembers: OnSiteMember[] = onSiteRows.map((row) => {
      const resolvedName = profileMap.get(row.memberId) || 'Staff Member'
      const initials =
        resolvedName
          .split(' ')
          .filter(Boolean)
          .map((n: string) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'SM'

      const time = new Date(row.scanTimestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })

      const terminal = row.terminalId ? 'Kiosk terminal' : 'Unassigned terminal'

      return {
        id: row.id,
        memberId: row.memberId,
        name: resolvedName,
        terminal,
        time,
        initials,
      }
    })

    const summary: AttendanceSummary = {
      totalExpected: totalStaffCount,
      currentlyOnSite: onSiteRows.length,
      departedToday: departedCount,
      totalScansToday: logs.length,
      attendanceRate: totalStaffCount > 0 ? Math.min(100, Math.round((latestScanByMember.size / totalStaffCount) * 100)) : 0,
    }

    return { summary, onSiteMembers }
  } catch (err) {
    console.warn('[LiveHeadcount] Query error:', err)
    return { summary: emptySummary, onSiteMembers: [] }
  }
}
