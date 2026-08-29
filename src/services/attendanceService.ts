import { getSupabase } from '../lib/supabase'
import { ensureValidUuid } from '../utils/uuid'
import type {
  AttendanceLog,
  AttendanceDirection,
  LogAttendanceParams,
} from '../types/attendance'

// Re-export reporting utilities
export {
  fetchRecentLiveScans,
  fetchStaffAttendanceHistory,
  exportStaffAttendanceLogs,
  exportWorkspaceAttendanceLogs,
  fetchTodaySummary,
  type LiveScanFeedItem,
} from './attendanceReporting'

// In-memory cache for anti-double-scan protection (15s)
const recentScansDebounce = new Map<string, number>()

export async function getLastScanToday(memberId: string): Promise<AttendanceLog | null> {
  try {
    const supabase = getSupabase()
    const validMemberUuid = ensureValidUuid(memberId)
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('member_id', validMemberUuid)
      .gte('scan_timestamp', startOfDay.toISOString())
      .order('scan_timestamp', { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0) return null

    const row = data[0]
    return {
      id: row.id,
      organizationId: row.organization_id,
      memberId: row.member_id,
      staffName: 'Staff Member',
      terminalId: row.terminal_id,
      direction: row.direction as AttendanceDirection,
      scanTimestamp: row.scan_timestamp,
      verificationMode: row.verification_mode,
      confidenceScore: row.confidence_score,
      status: row.status,
      createdAt: row.created_at,
    }
  } catch (err) {
    console.warn('[Attendance] Failed to query last scan:', err)
    return null
  }
}

export async function determineDirection(
  memberId: string,
  explicitDirection?: AttendanceDirection
): Promise<AttendanceDirection> {
  if (explicitDirection && (explicitDirection === 'in' || explicitDirection === 'out')) {
    return explicitDirection
  }
  const lastScan = await getLastScanToday(memberId)
  return !lastScan || lastScan.direction === 'out' ? 'in' : 'out'
}

export async function logAttendanceScan(
  params: LogAttendanceParams
): Promise<{ success: boolean; log?: AttendanceLog; message: string; dbSaved?: boolean }> {
  const {
    memberId,
    staffName,
    terminalId,
    organizationId,
    explicitDirection,
    verificationMode = 'biometric_fs80h',
    confidenceScore = 98,
  } = params

  const now = Date.now()
  const lastScanTime = recentScansDebounce.get(memberId)

  if (lastScanTime && now - lastScanTime < 15000) {
    return {
      success: false,
      message: 'Scan registered recently. Please wait a moment before scanning again.',
    }
  }

  const direction = await determineDirection(memberId, explicitDirection)
  const orgUUID = ensureValidUuid(organizationId, 'f1bad42f-69ef-40d1-965c-780833890b2f')
  const memberUUID = ensureValidUuid(memberId, '2f158922-80a3-4722-b7c6-c7ec97d70ca0')
  const scanIso = new Date(now).toISOString()

  try {
    const supabase = getSupabase()

    // 1. Insert into attendance_logs (Strict column schema matching remote DB)
    const { data, error } = await supabase
      .from('attendance_logs')
      .insert({
        organization_id: orgUUID,
        member_id: memberUUID,
        terminal_id: terminalId,
        direction,
        scan_timestamp: scanIso,
        verification_mode: verificationMode,
        confidence_score: confidenceScore,
        status: 'verified',
      })
      .select()
      .single()

    recentScansDebounce.set(memberId, now)

    if (error) {
      console.warn('[Attendance] Supabase insert warning (RLS or policy):', error.message)
      // Provide detailed logging to help diagnose
      const syntheticLog: AttendanceLog = {
        id: `att_${now}`,
        organizationId: orgUUID,
        memberId: memberUUID,
        staffName,
        terminalId,
        direction,
        scanTimestamp: scanIso,
        verificationMode,
        confidenceScore,
        status: 'verified',
      }
      return {
        success: true,
        log: syntheticLog,
        dbSaved: false,
        message: `${direction === 'in' ? 'Check-In (Arrival)' : 'Check-Out (Departure)'} verified (Buffer: ${error.message})`,
      }
    }

    console.log('[Attendance] Successfully saved attendance log to Supabase:', data?.id)

    return {
      success: true,
      dbSaved: true,
      log: {
        id: data.id,
        organizationId: data.organization_id,
        memberId: data.member_id,
        staffName,
        terminalId: data.terminal_id,
        direction: data.direction as AttendanceDirection,
        scanTimestamp: data.scan_timestamp,
        verificationMode: data.verification_mode,
        confidenceScore: data.confidence_score,
        status: data.status,
        createdAt: data.created_at,
      },
      message: `${direction === 'in' ? 'Check-In (Arrival)' : 'Check-Out (Departure)'} successfully recorded in database.`,
    }
  } catch (err) {
    console.error('[Attendance] Exception in logAttendanceScan:', err)
    return { success: false, message: err instanceof Error ? err.message : 'Unknown scan error' }
  }
}
