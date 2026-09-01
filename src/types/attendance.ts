export type AttendanceDirection = 'in' | 'out'
export type AttendanceStatus = 'verified' | 'flagged' | 'manual_override'
export type AttendancePeriod = 'Day' | 'Week' | 'Month'

export interface AttendanceLog {
  id: string
  /** workspaces.id (workspace-scoped FK) */
  workspaceId: string
  /** workspace_members.id - canonical member reference */
  memberId: string
  /** kiosks.id when the scan came from a paired terminal (nullable in schema) */
  terminalId?: string
  direction: AttendanceDirection
  scanTimestamp: string
  verificationMode: string
  confidenceScore: number
  status: AttendanceStatus
  createdAt?: string
}

export interface AttendanceSummary {
  totalExpected: number
  currentlyOnSite: number
  departedToday: number
  totalScansToday: number
  attendanceRate: number
}

export interface AttendanceChartPoint {
  label: string
  fullLabel?: string
  count: number
  percentage: number
  isPeak: boolean
}

export interface AttendanceVolumeData {
  period: AttendancePeriod
  totalScans: number
  points: AttendanceChartPoint[]
  peakCount: number
  periodDescription: string
}

export interface OnSiteMember {
  id: string
  memberId: string
  name: string
  department?: string
  terminal: string
  time: string
  initials: string
  avatarUrl?: string
}

export interface LogAttendanceParams {
  /** workspace_members.id - resolved by the identity pipeline */
  memberId: string
  /** workspaces.id - required for a database write; otherwise the scan buffers */
  workspaceId?: string
  /** kiosks.id - nullable; unpaired terminals log without one */
  terminalId?: string
  explicitDirection?: AttendanceDirection
  verificationMode?: string
  confidenceScore?: number
}


