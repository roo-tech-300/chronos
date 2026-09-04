export type PunctualityStatus = 'on_time' | 'grace_period' | 'late' | 'overtime' | 'early_departure'

export interface ShiftProfile {
  id: string
  workspaceId: string
  name: string
  startTime: string // "HH:MM" e.g. "08:30"
  endTime: string // "HH:MM" e.g. "17:00"
  gracePeriodMins: number // e.g. 15
  lateThresholdMins: number // e.g. 30
  overtimeThresholdMins: number // e.g. 60
  workDays: number[] // 1 = Mon, 5 = Fri, 0 = Sun
  isDefault: boolean
}

export interface PunctualityEvaluation {
  status: PunctualityStatus
  minutesDeviation: number
  statusLabel: string
  badgeVariant: 'success' | 'warning' | 'error' | 'neutral' | 'info'
  shiftName: string
}

export interface TimesheetEntry {
  date: string
  memberId: string
  memberName: string
  department: string
  firstIn: string | null
  lastOut: string | null
  hoursWorked: number
  shiftName: string
  punctuality: PunctualityStatus
  minutesLate: number
  isOvertime: boolean
}
