import { getSupabase } from '../lib/supabase'
import { isUuid } from '../utils/uuid'
import { resolveAttendanceMemberId } from './attendanceMemberResolver'
import type { AttendanceDirection, AttendanceSummary } from '../types/attendance'
import type { ScanActivity } from '../dummy/profile-mock'

export { exportStaffAttendanceLogs, exportWorkspaceAttendanceLogs } from './attendanceExport'

export interface LiveScanFeedItem {
  id: string
  name: string
  terminal: string
  time: string
  initials: string
  direction: AttendanceDirection
}

export async function resolveMemberNameMap(
  memberIds: string[],
  workspaceId?: string,
): Promise<Map<string, string>> {
  const nameMap = new Map<string, string>()
  if (!memberIds.length) return nameMap

  const supabase = getSupabase()
  try {
    const identities = await Promise.all(
      Array.from(new Set(memberIds)).map(async (memberId) => {
        const { data } = await supabase.rpc('resolve_kiosk_identity', {
          p_identifier: memberId,
          p_workspace_id: workspaceId || null,
        })
        const identity = Array.isArray(data) ? data[0] : data
        if (!identity || typeof identity !== 'object') return null
        const displayName = (identity as { display_name?: unknown }).display_name
        return typeof displayName === 'string' && displayName.trim()
          ? { memberId, name: displayName.trim() }
          : null
      }),
    )

    identities.forEach((identity) => {
      if (identity) nameMap.set(identity.memberId, identity.name)
    })
  } catch (err) {
    console.warn('[AttendanceReporting] Could not resolve member identities:', err)
  }

  return nameMap
}

export async function fetchRecentLiveScans(
  workspaceId?: string,
  limit = 6,
  memberIds?: string[]
): Promise<LiveScanFeedItem[]> {
  if (!workspaceId || !isUuid(workspaceId)) return []
  if (memberIds && memberIds.length === 0) return []

  try {
    const supabase = getSupabase()

    let query = supabase
      .from('attendance_logs')
      .select('id, member_id, terminal_id, direction, scan_timestamp')
      .eq('workspace_id', workspaceId)
      .order('scan_timestamp', { ascending: false })

    if (memberIds && memberIds.length > 0) {
      query = query.in('member_id', memberIds)
    }

    const { data, error } = await query.limit(limit * 2)

    if (error || !data || data.length === 0) return []

    const memberIdSet = memberIds ? new Set(memberIds) : null
    const scopedRows = memberIdSet
      ? data.filter((r) => memberIdSet.has(r.member_id)).slice(0, limit)
      : data.slice(0, limit)

    if (scopedRows.length === 0) return []

    const activeMemberIds = Array.from(new Set(scopedRows.map((r) => r.member_id).filter(Boolean)))
    const profileMap = await resolveMemberNameMap(activeMemberIds, workspaceId)

    return scopedRows.map((row) => {
      const name = profileMap.get(row.member_id) || 'Staff Member'
      const initials = name
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'SM'

      const time = new Date(row.scan_timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })

      const terminal = row.terminal_id ? 'Kiosk terminal' : 'Unassigned terminal'

      return {
        id: row.id,
        name,
        terminal: `${terminal} • ${row.direction === 'in' ? 'Check-In' : 'Check-Out'}`,
        time,
        initials,
        direction: row.direction as AttendanceDirection,
      }
    })
  } catch (err) {
    console.warn('Error fetching live scans:', err)
    return []
  }
}

export async function fetchStaffAttendanceHistory(memberId: string): Promise<ScanActivity[]> {
  if (!memberId) return []
  try {
    const supabase = getSupabase()

    // attendance_logs.member_id references workspace_members.id - callers may pass
    // an auth user_id or a CHR staff code, so resolve to the canonical id first.
    const canonicalId = await resolveAttendanceMemberId(supabase, memberId)
    if (!canonicalId) return []

    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('member_id', canonicalId)
      .order('scan_timestamp', { ascending: false })
      .limit(10)

    if (error || !data || data.length === 0) return []

    return data.map((row) => ({
      terminal: row.terminal_id?.startsWith('STATION-') ? row.terminal_id : `Terminal ${row.terminal_id || 'A'}`,
      action: row.direction === 'in' ? 'Biometric Check-In (Arrival)' : 'Biometric Check-Out (Departure)',
      time: new Date(row.scan_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }))
  } catch (err) {
    console.warn('Error fetching member attendance history:', err)
    return []
  }
}

export async function fetchTodaySummary(workspaceId?: string, totalStaffCount = 50): Promise<AttendanceSummary> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  if (!workspaceId || !isUuid(workspaceId)) {
    return { totalExpected: totalStaffCount, currentlyOnSite: 0, departedToday: 0, totalScansToday: 0, attendanceRate: 0 }
  }

  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('member_id, direction')
      .eq('workspace_id', workspaceId)
      .gte('scan_timestamp', startOfDay.toISOString())

    if (error || !data) {
      return { totalExpected: totalStaffCount, currentlyOnSite: 0, departedToday: 0, totalScansToday: 0, attendanceRate: 0 }
    }

    const memberStates = new Map<string, AttendanceDirection>()
    data.forEach((r) => memberStates.set(r.member_id, r.direction as AttendanceDirection))

    let onSite = 0
    let departed = 0
    memberStates.forEach((dir) => {
      if (dir === 'in') onSite++
      if (dir === 'out') departed++
    })

    return {
      totalExpected: totalStaffCount,
      currentlyOnSite: onSite,
      departedToday: departed,
      totalScansToday: data.length,
      attendanceRate: totalStaffCount > 0 ? Math.round((memberStates.size / totalStaffCount) * 100) : 0,
    }
  } catch {
    return { totalExpected: totalStaffCount, currentlyOnSite: 0, departedToday: 0, totalScansToday: 0, attendanceRate: 0 }
  }
}
