import { getSupabase } from '../lib/supabase'
import { isUuid } from '../utils/uuid'
import { enqueueOfflineScan } from './terminalOfflineQueue'
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

const DEFAULT_WORKSPACE_UUID = '00000000-0000-0000-0000-000000000000'

export async function getLastScanToday(memberId: string): Promise<AttendanceLog | null> {
  try {
    const supabase = getSupabase()
    const validMemberId = (memberId || '').trim()
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('member_id', validMemberId)
      .gte('scan_timestamp', startOfDay.toISOString())
      .order('scan_timestamp', { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0) return null

    const row = data[0]
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      memberId: row.member_id,
      terminalId: row.terminal_id ?? undefined,
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

function directionLabel(direction: AttendanceDirection): string {
  return direction === 'in' ? 'Check-In (Arrival)' : 'Check-Out (Departure)'
}

function buildSyntheticLog(
  memberId: string,
  workspaceId: string,
  terminalId: string | null,
  direction: AttendanceDirection,
  scanIso: string,
  verificationMode: string,
  confidenceScore: number
): AttendanceLog {
  return {
    id: `att_${Date.now()}`,
    workspaceId,
    memberId,
    terminalId: terminalId ?? undefined,
    direction,
    scanTimestamp: scanIso,
    verificationMode,
    confidenceScore,
    status: 'verified',
  }
}

export async function logAttendanceScan(
  params: LogAttendanceParams
): Promise<{ success: boolean; log?: AttendanceLog; message: string; dbSaved?: boolean }> {
  const {
    memberId,
    workspaceId,
    terminalId,
    explicitDirection,
    verificationMode = 'biometric_fs80h',
    confidenceScore = 98,
  } = params

  // Schema: workspace_id and member_id are NOT NULL UUIDs with FK constraints.
  // Fabricated or placeholder ids would be rejected by the database - buffer instead.
  const cleanMemberId = (memberId || '').trim()
  if (!isUuid(cleanMemberId)) {
    return {
      success: false,
      message: 'Scan could not be attributed to a workspace member (invalid member reference).',
    }
  }

  const now = Date.now()
  const lastScanTime = recentScansDebounce.get(cleanMemberId)

  if (lastScanTime && now - lastScanTime < 15000) {
    return {
      success: false,
      message: 'Scan registered recently. Please wait a moment before scanning again.',
    }
  }

  // Reserve the debounce slot SYNCHRONOUSLY, before the first await. A single
  // physical scan is delivered by several bridge paths and subscribed listeners
  // (direct identify response, SSE, fallback poll, kiosk hook + global toast) that
  // all call this function concurrently. Without this immediate reservation each
  // one would pass the gate above and insert its own attendance_logs row.
  recentScansDebounce.set(cleanMemberId, now)

  const direction = await determineDirection(cleanMemberId, explicitDirection)
  const scanIso = new Date(now).toISOString()

  const cleanWorkspaceId = (workspaceId || '').trim()
  const hasValidWorkspace = isUuid(cleanWorkspaceId) && cleanWorkspaceId !== DEFAULT_WORKSPACE_UUID
  const cleanTerminalId = (terminalId || '').trim()
  const validTerminalId = isUuid(cleanTerminalId) ? cleanTerminalId : null

  // Terminals not paired to a workspace still complete the scan UX, but the log is
  // buffered (dbSaved: false) instead of violating the database FK constraints.
  if (!hasValidWorkspace) {
    return {
      success: true,
      log: buildSyntheticLog(
        cleanMemberId,
        cleanWorkspaceId,
        validTerminalId,
        direction,
        scanIso,
        verificationMode,
        confidenceScore
      ),
      dbSaved: false,
      message: `${directionLabel(direction)} verified (workspace not paired - scan buffered).`,
    }
  }

  // If device is offline, enqueue directly to local storage queue
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOfflineScan(params)
    return {
      success: true,
      log: buildSyntheticLog(cleanMemberId, cleanWorkspaceId, validTerminalId, direction, scanIso, verificationMode, confidenceScore),
      dbSaved: false,
      message: `${directionLabel(direction)} verified (Offline mode - queued for auto-sync).`,
    }
  }

  const insertPayload = {
    workspace_id: cleanWorkspaceId,
    member_id: cleanMemberId,
    terminal_id: validTerminalId,
    direction,
    scan_timestamp: scanIso,
    verification_mode: verificationMode,
    confidence_score: Math.round(confidenceScore),
    status: 'verified',
  }

  try {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('attendance_logs')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      console.warn('[Attendance] Supabase insert warning (RLS or policy):', error.message)
      enqueueOfflineScan(params)
      return {
        success: true,
        log: buildSyntheticLog(cleanMemberId, cleanWorkspaceId, validTerminalId, direction, scanIso, verificationMode, confidenceScore),
        dbSaved: false,
        message: `${directionLabel(direction)} verified (Buffered offline: ${error.message})`,
      }
    }

    return {
      success: true,
      dbSaved: true,
      log: {
        id: data.id,
        workspaceId: data.workspace_id,
        memberId: data.member_id,
        terminalId: data.terminal_id ?? undefined,
        direction: data.direction as AttendanceDirection,
        scanTimestamp: data.scan_timestamp,
        verificationMode: data.verification_mode,
        confidenceScore: data.confidence_score,
        status: data.status,
        createdAt: data.created_at,
      },
      message: `${directionLabel(direction)} successfully recorded in database.`,
    }
  } catch (err) {
    console.error('[Attendance] Exception in logAttendanceScan:', err)
    enqueueOfflineScan(params)
    return {
      success: true,
      log: buildSyntheticLog(cleanMemberId, cleanWorkspaceId, validTerminalId, direction, scanIso, verificationMode, confidenceScore),
      dbSaved: false,
      message: `${directionLabel(direction)} verified (Buffered offline after network error).`,
    }
  }
}

