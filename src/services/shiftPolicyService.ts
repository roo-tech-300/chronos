import type { AttendanceDirection } from '../types/attendance'
import type { ShiftProfile, PunctualityEvaluation } from '../types/shifts'

export const DEFAULT_SHIFTS: ShiftProfile[] = [
  {
    id: 'shift_standard',
    workspaceId: 'default',
    name: 'Standard Office (08:30 - 17:00)',
    startTime: '08:30',
    endTime: '17:00',
    gracePeriodMins: 15,
    lateThresholdMins: 30,
    overtimeThresholdMins: 60,
    workDays: [1, 2, 3, 4, 5],
    isDefault: true,
  },
  {
    id: 'shift_early',
    workspaceId: 'default',
    name: 'Early Operations (07:00 - 15:30)',
    startTime: '07:00',
    endTime: '15:30',
    gracePeriodMins: 10,
    lateThresholdMins: 20,
    overtimeThresholdMins: 60,
    workDays: [1, 2, 3, 4, 5],
    isDefault: false,
  },
]

function parseTimeToMinutes(timeStr: string): number {
  const [hours, mins] = timeStr.split(':').map((v) => parseInt(v, 10))
  return (hours || 0) * 60 + (mins || 0)
}

function getScanMinutes(timestamp: string | Date): number {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  return date.getHours() * 60 + date.getMinutes()
}

export function evaluatePunctuality(
  scanTimestamp: string | Date,
  direction: AttendanceDirection,
  shift: ShiftProfile = DEFAULT_SHIFTS[0]
): PunctualityEvaluation {
  const scanMins = getScanMinutes(scanTimestamp)

  if (direction === 'in') {
    const shiftStartMins = parseTimeToMinutes(shift.startTime)
    const diff = scanMins - shiftStartMins

    if (diff <= 0) {
      return {
        status: 'on_time',
        minutesDeviation: 0,
        statusLabel: 'On Time',
        badgeVariant: 'success',
        shiftName: shift.name,
      }
    }

    if (diff <= shift.gracePeriodMins) {
      return {
        status: 'grace_period',
        minutesDeviation: diff,
        statusLabel: `Grace Period (+${diff}m)`,
        badgeVariant: 'neutral',
        shiftName: shift.name,
      }
    }

    return {
      status: 'late',
      minutesDeviation: diff,
      statusLabel: `Late Arrival (+${diff}m)`,
      badgeVariant: 'error',
      shiftName: shift.name,
    }
  }

  // Direction: 'out' (Departure)
  const shiftEndMins = parseTimeToMinutes(shift.endTime)
  const diff = scanMins - shiftEndMins

  if (diff < -shift.gracePeriodMins) {
    const earlyBy = Math.abs(diff)
    return {
      status: 'early_departure',
      minutesDeviation: earlyBy,
      statusLabel: `Early Departure (-${earlyBy}m)`,
      badgeVariant: 'warning',
      shiftName: shift.name,
    }
  }

  if (diff >= shift.overtimeThresholdMins) {
    return {
      status: 'overtime',
      minutesDeviation: diff,
      statusLabel: `Overtime (+${Math.round(diff / 60)}h)`,
      badgeVariant: 'info',
      shiftName: shift.name,
    }
  }

  return {
    status: 'on_time',
    minutesDeviation: 0,
    statusLabel: 'Normal Departure',
    badgeVariant: 'success',
    shiftName: shift.name,
  }
}

export function getWorkspaceShifts(workspaceId: string): ShiftProfile[] {
  try {
    const stored = localStorage.getItem(`chronos_shifts_${workspaceId}`)
    if (stored) {
      const parsed = JSON.parse(stored) as ShiftProfile[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // Ignore storage parsing error
  }
  return DEFAULT_SHIFTS.map((s) => ({ ...s, workspaceId }))
}

export function saveWorkspaceShifts(workspaceId: string, shifts: ShiftProfile[]): void {
  try {
    localStorage.setItem(`chronos_shifts_${workspaceId}`, JSON.stringify(shifts))
  } catch (err) {
    console.warn('[ShiftPolicy] Failed to persist shifts to storage:', err)
  }
}
