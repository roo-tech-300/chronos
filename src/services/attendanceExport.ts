import { getSupabase } from '../lib/supabase'
import { isUuid } from '../utils/uuid'
import { downloadCsv } from '../utils/csvExport'
import { resolveAttendanceMemberId } from './attendanceMemberResolver'
import { resolveMemberNameMap } from './attendanceReporting'

/**
 * Exports historical attendance activity for an individual staff member to CSV.
 */
export async function exportStaffAttendanceLogs(memberId: string, staffName: string): Promise<void> {
  if (!memberId) return
  try {
    const supabase = getSupabase()
    const canonicalId = await resolveAttendanceMemberId(supabase, memberId)

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

/**
 * Exports attendance records for a workspace or scoped unit department to CSV.
 */
export async function exportWorkspaceAttendanceLogs(
  workspaceId?: string,
  workspaceName = 'Workspace',
  memberIds?: string[]
): Promise<void> {
  try {
    const supabase = getSupabase()

    if (!workspaceId || !isUuid(workspaceId)) {
      downloadCsv(`attendance_report_${workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.csv`, [
        { 'Workspace': workspaceName, 'Notice': 'No workspace selected.' },
      ])
      return
    }

    // If unit-scoped and no members exist in department, export empty notice
    if (memberIds && memberIds.length === 0) {
      downloadCsv(`attendance_report_${workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.csv`, [
        { 'Workspace': workspaceName, 'Notice': 'No members enrolled in this department.' },
      ])
      return
    }

    let query = supabase
      .from('attendance_logs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('scan_timestamp', { ascending: false })

    if (memberIds && memberIds.length > 0) {
      query = query.in('member_id', memberIds)
    }

    const { data } = await query

    const memberIdSet = memberIds ? new Set(memberIds) : null
    const filteredData = (data || []).filter((r) => !memberIdSet || memberIdSet.has(r.member_id))

    const activeMemberIds = Array.from(new Set(filteredData.map((r) => r.member_id).filter(Boolean)))
    const profileMap = await resolveMemberNameMap(activeMemberIds, workspaceId)

    const rows = filteredData.length > 0
      ? filteredData.map((row) => ({
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
