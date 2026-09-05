import { getSupabase } from '../lib/supabase'
import type { AttendanceLog, AttendanceDirection } from '../types/attendance'

export const DEFAULT_WORKSPACE_UUID = '00000000-0000-0000-0000-000000000000'

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

export function directionLabel(direction: AttendanceDirection): string {
  return direction === 'in' ? 'Check-In (Arrival)' : 'Check-Out (Departure)'
}

export function buildSyntheticLog(
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
