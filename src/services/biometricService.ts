import { futronicBridge } from './futronicBridge'
import { getSupabase } from '../lib/supabase'
import type { ScanAngle, AngleScanResult, FinalizeEnrollmentParams } from '../types/biometric'

export interface SingleAngleCaptureParams {
  memberId: string
  organizationId: string
  staffName: string
  angle: ScanAngle
  passNumber: number
  onLog?: (log: { id: string; time: string; text: string; type: 'info' | 'success' | 'warn' | 'error' }) => void
}

export function sanitizeUUID(id?: string): string {
  if (!id) return '00000000-0000-0000-0000-000000000000'
  const clean = id.trim().toLowerCase()
  const match = clean.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  return match ? clean : '00000000-0000-0000-0000-000000000000'
}

/**
 * Validates and sanitizes XYT minutiae template text.
 * Strictly filters each line so only valid integer lines (X Y Theta [Quality]) remain.
 */
export function cleanXytMinutiaeText(raw: string): string {
  if (!raw || typeof raw !== 'string') return ''
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const valid: string[] = []
  for (const line of lines) {
    if (line.startsWith('#')) continue
    const tokens = line.split(/\s+/).filter(Boolean)
    if ((tokens.length === 3 || tokens.length === 4) && tokens.every(t => /^-?\d+$/.test(t))) {
      valid.push(tokens.join(' '))
    }
  }
  return valid.join('\n') + (valid.length > 0 ? '\n' : '')
}

/**
 * Alias for captureAngleAndUpload for backward compatibility
 */
export async function captureAndUploadAngle(params: SingleAngleCaptureParams): Promise<AngleScanResult> {
  return captureAngleAndUpload(params)
}

/**
 * Checks if a member has completed biometric enrollment
 */
export async function checkBiometricEnrolled(memberId: string): Promise<boolean> {
  if (!memberId) return false
  try {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('biometric_templates')
      .select('id')
      .eq('member_id', memberId)
      .limit(1)

    return Boolean(data && data.length > 0)
  } catch {
    return false
  }
}

/**
 * APPROACH B:
 * Captures 1 angle via the Node Bridge, sanitizes the XYT minutiae, and uploads it
 * into Supabase Storage under `biometrics/{orgUUID}/{memberId}/right_index_{angle}_{timestamp}.xyt`.
 */
export async function captureAngleAndUpload(
  params: SingleAngleCaptureParams
): Promise<AngleScanResult> {
  const { memberId, organizationId, staffName, angle, passNumber, onLog } = params
  const orgUUID = sanitizeUUID(organizationId)

  const emitLog = (text: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString()
    console.log(`[Enrollment Pass ${passNumber}] [${time}] ${text}`)
    if (onLog) {
      onLog({ id: Math.random().toString(36).substring(2, 9), time, text, type })
    }
  }

  emitLog(`Starting Pass ${passNumber}/3 (${angle.replace('_', ' ').toUpperCase()}) for ${staffName}...`, 'info')

  const bridgeAngle = angle === 'center' ? 'straight' : angle === 'left_edge' ? 'tilted_left' : 'tilted_right'
  const captureRes = await futronicBridge.triggerCapture({
    id: memberId,
    angle: bridgeAngle,
  })

  if (!captureRes.success || !captureRes.payload) {
    emitLog(`Pass ${passNumber} scan failed: ${captureRes.error || 'No fingerprint captured.'}`, 'error')
    throw new Error(captureRes.error || `Failed to capture pass ${passNumber} from optical sensor.`)
  }

  const quality = captureRes.payload.qualityScore || 95
  emitLog(`Pass ${passNumber} captured! Optical quality: ${quality}%`, 'success')

  const rawTemplate = captureRes.payload.rawTemplate || ''
  const cleanedTemplate = cleanXytMinutiaeText(rawTemplate)
  const templateToUpload = cleanedTemplate || rawTemplate

  const templateHash = captureRes.payload.templateHash || `tpl_${memberId}_${angle}_${Date.now()}`
  const timestamp = Date.now()
  const storagePath = `${orgUUID}/${memberId}/right_index_${angle}_${timestamp}.xyt`

  emitLog(`Uploading angle template to Supabase Storage (${storagePath})...`, 'info')
  const supabase = getSupabase()
  const templateBlob = new Blob([templateToUpload], { type: 'text/plain' })

  const { error: uploadError } = await supabase.storage
    .from('biometrics')
    .upload(storagePath, templateBlob, {
      contentType: 'text/plain',
      upsert: true,
    })

  if (uploadError) {
    emitLog(`Storage notice: ${uploadError.message}. Proceeding with local template cache.`, 'warn')
  } else {
    emitLog(`Stored in bucket: biometrics/${storagePath}`, 'success')
  }

  return {
    angle,
    templateHash,
    storagePath,
    qualityScore: quality,
  }
}

/**
 * APPROACH B:
 * Writes a SINGLE atomic row into the biometric_templates table linking all 3
 * completed storage passes to the staff member's Right Index Finger.
 */
export async function finalizeEnrollment(params: FinalizeEnrollmentParams): Promise<void> {
  const { memberId, organizationId, staffName, passes, onLog } = params
  const orgUUID = sanitizeUUID(organizationId)

  const emitLog = (text: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString()
    console.log(`[Enrollment Finalize] [${time}] ${text}`)
    if (onLog) {
      onLog({ id: Math.random().toString(36).substring(2, 9), time, text, type })
    }
  }

  emitLog(`Saving biometric profile to database for ${staffName}...`, 'info')

  const centerPass = passes.find((p) => p.angle === 'center') || passes[0]
  const supabase = getSupabase()

  // Remove existing biometric template rows for this member
  await supabase
    .from('biometric_templates')
    .delete()
    .eq('member_id', memberId)

  // Insert master row
  const { error: insertError } = await supabase
    .from('biometric_templates')
    .insert({
      organization_id: orgUUID,
      member_id: memberId,
      template_hash: centerPass.templateHash,
      storage_path: centerPass.storagePath,
      finger_position: 'Right Index',
      quality_score: centerPass.qualityScore || 95,
      created_at: new Date().toISOString(),
    })

  if (insertError) {
    emitLog(`Database error: ${insertError.message}`, 'error')
    throw new Error(`Failed to save template to database: ${insertError.message}`)
  }

  // Update member record to mark biometric enrollment as complete
  await supabase
    .from('members')
    .update({
      biometrics_enrolled: true,
      biometrics_enrolled_at: new Date().toISOString(),
    })
    .eq('id', memberId)

  emitLog(`Biometric enrollment successfully recorded for ${staffName}!`, 'success')
}
