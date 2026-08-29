import { getSupabase } from '../lib/supabase'
import { sanitizeUUID } from './biometricService'
import { downloadCsv } from '../utils/csvExport'
import type {
  AttendanceDirection,
  AttendanceSummary,
} from '../types/attendance'
import type { ScanActivity } from '../dummy/profile-mock'

export interface LiveScanFeedItem {
  id: string
  name: string
  terminal: string
  time: string
  initials: string
  direction: AttendanceDirection
}

export async function fetchRecentLiveScans(
  organizationId?: string,
  limit = 6
): Promise<LiveScanFeedItem[]> {
  try {
    const supabase = getSupabase()
    const orgUUID = sanitizeUUID(organizationId)

    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('organization_id', orgUUID)
      .order('scan_timestamp', { ascending: false })
      .limit(limit)

    if (error || !data || data.length === 0) return []

    return data.map((row) => {
      const name = row.staff_name || 'Staff Member'
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

      const terminal = row.terminal_id.startsWith('STATION-')
        ? row.terminal_id
        : `Terminal ${row.terminal_id}`

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
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('member_id', memberId)
      .order('scan_timestamp', { ascending: false })
      .limit(10)

    if (error || !data || data.length === 0) return []

    return data.map((row) => ({
      terminal: row.terminal_id.startsWith('STATION-') ? row.terminal_id : `Terminal ${row.terminal_id}`,
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
    const { data } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('member_id', memberId)
      .order('scan_timestamp', { ascending: false })

    const rows = (data && data.length > 0)
      ? data.map((row) => ({
          'Log ID': row.id,
          'Staff ID': row.member_id,
          'Staff Name': row.staff_name || staffName,
          'Direction': row.direction === 'in' ? 'Arrival (Check-In)' : 'Departure (Check-Out)',
          'Timestamp': new Date(row.scan_timestamp).toLocaleString(),
          'Terminal Station': row.terminal_id,
          'Mode': row.verification_mode,
          'Confidence': `${row.confidence_score}%`,
          'Status': row.status,
        }))
      : [
          {
            'Staff ID': memberId,
            'Staff Name': staffName,
            'Notice': 'No biometric attendance records logged yet.',
          },
        ]

    const safeName = staffName.toLowerCase().replace(/[^a-z0-9]/g, '_')
    downloadCsv(`attendance_log_${safeName}_${Date.now()}.csv`, rows)
  } catch (err) {
    console.error('Failed to export CSV logs:', err)
  }
}

export async function exportWorkspaceAttendanceLogs(
  organizationId?: string,
  workspaceName = 'Workspace'
): Promise<void> {
  try {
    const supabase = getSupabase()
    const orgUUID = sanitizeUUID(organizationId)
    const { data } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('organization_id', orgUUID)
      .order('scan_timestamp', { ascending: false })

    const rows = (data && data.length > 0)
      ? data.map((row) => ({
          'Log ID': row.id,
          'Staff ID': row.member_id,
          'Staff Name': row.staff_name,
          'Direction': row.direction === 'in' ? 'Arrival (Check-In)' : 'Departure (Check-Out)',
          'Timestamp': new Date(row.scan_timestamp).toLocaleString(),
          'Terminal Station': row.terminal_id,
          'Verification Mode': row.verification_mode,
          'Confidence': `${row.confidence_score}%`,
          'Status': row.status,
        }))
      : [
          {
            'Workspace': workspaceName,
            'Notice': 'No attendance scans recorded for this workspace today.',
          },
        ]

    const safeName = workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '_')
    downloadCsv(`attendance_report_${safeName}_${Date.now()}.csv`, rows)
  } catch (err) {
    console.error('Failed to export workspace CSV logs:', err)
  }
}

export async function fetchTodaySummary(organizationId?: string, totalStaffCount = 50): Promise<AttendanceSummary> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const orgUUID = sanitizeUUID(organizationId)

  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('member_id, direction')
      .eq('organization_id', orgUUID)
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
