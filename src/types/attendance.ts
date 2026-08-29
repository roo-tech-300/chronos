export type AttendanceDirection = 'in' | 'out'
export type AttendanceStatus = 'verified' | 'flagged' | 'manual_override'

export interface AttendanceLog {
  id: string
  organizationId: string
  memberId: string
  staffName: string
  staffCode?: string
  department?: string
  terminalId: string
  terminalName?: string
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

export interface LogAttendanceParams {
  memberId: string
  staffName: string
  terminalId: string
  terminalName?: string
  department?: string
  organizationId?: string
  explicitDirection?: AttendanceDirection
  verificationMode?: string
  confidenceScore?: number
}
