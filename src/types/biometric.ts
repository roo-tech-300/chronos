export type ScanAngle = 'center' | 'left_edge' | 'right_edge'

export interface ScanAngleStep {
  angle: ScanAngle
  label: string
  instruction: string
  description: string
}

export interface EnrollmentStepLog {
  id: string
  time: string
  text: string
  type: 'info' | 'success' | 'warn' | 'error'
}

export interface AngleScanResult {
  angle: ScanAngle
  templateHash: string
  storagePath: string
  qualityScore: number
}

export interface FinalizeEnrollmentParams {
  memberId: string
  organizationId?: string
  staffName: string
  passes: AngleScanResult[]
  onLog?: (log: EnrollmentStepLog) => void
}

export interface MultiPassEnrollmentResult {
  success: boolean
  passes: AngleScanResult[]
  primaryHash?: string
  error?: string
}
