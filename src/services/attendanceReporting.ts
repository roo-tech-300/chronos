import { getSupabase } from '../lib/supabase'
import { isUuid } from '../utils/uuid'
import { downloadCsv } from '../utils/csvExport'
import { resolveAttendanceMemberId } from './attendanceMemberResolver'
import type { AttendanceDirection, AttendanceSummary } from '../types/attendance'
import type { ScanActivity } from '../dummy/profile-mock'

export interface LiveScanFeedItem {
  id: string
  name: string
  terminal: string
  time: string
  initials: string
  direction: AttendanceDirection
}

export async function resolveMemberNameMap(memberIds: string[]): Promise<Map<string, string>> {
  const profileMap = new Map<string, string>()
  if (!memberIds.length) return profileMap

  const supabase = getSupabase()
  try {
    const { data: wmList } = await supabase
      .from('workspace_members')
      .select('id, user_id')
      .in('id', memberIds)

    const userIds = (wmList?.map((w) => w.user_id).filter(Boolean) as string[]) || []
    const idsToFetch = Array.from(new Set([...userIds, ...memberIds]))

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', idsToFetch)

    const pLookup = new Map<string, string>()
    profiles?.forEach((p) => {
      if (p.id) {
        const name =
          p.full_name ||
          p.name ||
          p.display_name ||
          (p.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : '') ||
          (p.email ? p.email.split('@')[0] : '')
        if (name) pLookup.set(p.id, name)
      }
    })

    wmList?.forEach((w) => {
      const name = (w.user_id ? pLookup.get(w.user_id) : undefined) || pLookup.get(w.id)
      if (name) profileMap.set(w.id, name)
    })

    memberIds.forEach((id) => {
      if (!profileMap.has(id) && pLookup.has(id)) {
        profileMap.set(id, pLookup.get(id)!)
      }
    })
  } catch (err) {
    console.warn('[AttendanceReporting] Could not resolve member profiles:', err)
  }

  return profileMap
}

export async function fetchRecentLiveScans(
  workspaceId?: string,
  limit = 6
): Promise<LiveScanFeedItem[]> {
  if (!workspaceId || !isUuid(workspaceId)) return []

  try {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('attendance_logs')
      .select('id, member_id, terminal_id, direction, scan_timestamp')
      .eq('workspace_id', workspaceId)
      .order('scan_timestamp', { ascending: false })
      .limit(limit)

    if (error || !data || data.length === 0) return []

    const memberIds = Array.from(new Set(data.map((r) => r.member_id).filter(Boolean)))
    const profileMap = await resolveMemberNameMap(memberIds)

    return data.map((row) => {
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

export async function exportStaffAttendanceLogs(memberId: string, staffName: string): Promise<void> {
  try {
    const supabase = getSupabase()

    // Resolve staff ids / CHR codes to the canonical workspace_members.id
    const canonicalId = await resolveAttendanceMemberId(supabase, memberId)

    // member_id is a workspace_members UUID - unresolvable codes can never match a row
    if (!canonicalId) {
      downloadCsv(`attendance_log_${staffName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.csv`, [
        { 'Staff ID': memberId, 'Staff Name': staffName, 'Notice': 'No records logged.' },
      ])
      return
    }

    const { data } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('member_id', canonicalId)
      .order('scan_timestamp', { ascending: false })

    const rows = (data && data.length > 0)
      ? data.map((row) => ({
          'Log ID': row.id,
          'Staff ID': row.member_id,
          'Staff Name': staffName,
          'Direction': row.direction === 'in' ? 'Arrival (Check-In)' : 'Departure (Check-Out)',
          'Timestamp': new Date(row.scan_timestamp).toLocaleString(),
          'Terminal Station': row.terminal_id,
          'Mode': row.verification_mode,
          'Confidence': `${row.confidence_score}%`,
          'Status': row.status,
        }))
      : [{ 'Staff ID': memberId, 'Staff Name': staffName, 'Notice': 'No records logged.' }]

    const safeName = staffName.toLowerCase().replace(/[^a-z0-9]/g, '_')
    downloadCsv(`attendance_log_${safeName}_${Date.now()}.csv`, rows)
  } catch (err) {
    console.error('Failed to export CSV logs:', err)
  }
}

export async function exportWorkspaceAttendanceLogs(
  workspaceId?: string,
  workspaceName = 'Workspace'
): Promise<void> {
  try {
    const supabase = getSupabase()

    if (!workspaceId || !isUuid(workspaceId)) {
      downloadCsv(`attendance_report_${workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.csv`, [
        { 'Workspace': workspaceName, 'Notice': 'No workspace selected.' },
      ])
      return
    }

    const { data } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('scan_timestamp', { ascending: false })

    const memberIds = Array.from(new Set(data?.map((r) => r.member_id).filter(Boolean) || []))
    const profileMap = await resolveMemberNameMap(memberIds)

    const rows = (data && data.length > 0)
      ? data.map((row) => ({
          'Log ID': row.id,
          'Staff ID': row.member_id,
          'Staff Name': profileMap.get(row.member_id) || 'Staff Member',
          'Direction': row.direction === 'in' ? 'Arrival (Check-In)' : 'Departure (Check-Out)',
          'Timestamp': new Date(row.scan_timestamp).toLocaleString(),
          'Terminal Station': row.terminal_id,
          'Verification Mode': row.verification_mode,
          'Confidence': `${row.confidence_score}%`,
          'Status': row.status,
        }))
      : [{ 'Workspace': workspaceName, 'Notice': 'No scans recorded.' }]

    const safeName = workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '_')
    downloadCsv(`attendance_report_${safeName}_${Date.now()}.csv`, rows)
  } catch (err) {
    console.error('Failed to export workspace CSV logs:', err)
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
