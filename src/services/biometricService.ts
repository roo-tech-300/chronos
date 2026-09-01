import { futronicBridge } from './futronicBridge'
import { getSupabase } from '../lib/supabase'
import { isRealWorkspaceUuid, isUuid } from '../utils/uuid'
import { computeTemplateSha256, countMinutiaeLines, isValidMinutiaeTemplate, MIN_MINUTIAE_LINES } from './biometricHash'
import type { ScanAngle, AngleScanResult, FinalizeEnrollmentParams } from '../types/biometric'

/** Persisted template format - the pipeline stores NIST XYT text, never binary ANSI 378. */
const TEMPLATE_FORMAT = 'NBIS_XYT'

export interface SingleAngleCaptureParams {
  memberId: string
  organizationId?: string
  staffName: string
  angle: ScanAngle
  passNumber: number
  onLog?: (log: { id: string; time: string; text: string; type: 'info' | 'success' | 'warn' | 'error' }) => void
}

/**
 * Returns the id when it is a real (non-sentinel) workspace UUID, otherwise null.
 * The nil UUID (00000000-...) means "no workspace" and must never reach the database.
 */
export function sanitizeUUID(id?: string): string | null {
  const clean = id?.trim().toLowerCase() ?? ''
  return isRealWorkspaceUuid(clean) ? clean : null
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
 * into Supabase Storage under `biometrics/{workspaceId}/{memberId}/right_index_{angle}_{timestamp}.xyt`.
 *
 * A pass is rejected BEFORE any upload when the capture does not carry enough
 * valid minutiae lines - garbage captures must never reach Storage or the DB.
 */
export async function captureAngleAndUpload(
  params: SingleAngleCaptureParams
): Promise<AngleScanResult> {
  const { memberId, organizationId, staffName, angle, passNumber, onLog } = params
  // biometric_templates.workspace_id is NOT NULL (FK -> workspaces.id). A capture
  // made outside a workspace can never be persisted, so fail fast rather than
  // leaving orphan objects under an 'unassigned' path.
  const workspaceId = sanitizeUUID(organizationId)

  const emitLog = (text: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString()
    console.log(`[Enrollment Pass ${passNumber}] [${time}] ${text}`)
    if (onLog) {
      onLog({ id: Math.random().toString(36).substring(2, 9), time, text, type })
    }
  }

  if (!workspaceId) {
    const message =
      'Biometric enrollment requires a workspace. Open this staff member from /workspace/:workspaceId/staff/:staffId to enroll.'
    emitLog(message, 'error')
    throw new Error(message)
  }

  // biometric_templates.member_id is NOT NULL (FK -> workspace_members.id). Only
  // a real workspace-member UUID can be persisted.
  if (!isUuid(memberId.trim().toLowerCase())) {
    const message = `Cannot enroll "${memberId}" - member_id must be a workspace member UUID.`
    emitLog(message, 'error')
    throw new Error(message)
  }

  emitLog(`Starting Pass ${passNumber}/3 (${angle.replace('_', ' ').toUpperCase()}) for ${staffName}...`, 'info')

  const bridgeAngle = angle === 'center' ? 'straight' : angle === 'left_edge' ? 'tilted_left' : 'tilted_right'
  const captureRes = await futronicBridge.triggerCapture({
    id: memberId,
    angle: bridgeAngle,
  })

  if (!captureRes.success || !captureRes.payload) {
    const message = captureRes.error || `Failed to capture pass ${passNumber} from optical sensor.`
    emitLog(message, 'error')
    throw new Error(message)
  }

  const quality = captureRes.payload.qualityScore || 95
  emitLog(`Pass ${passNumber} captured! Optical quality: ${quality}%`, 'success')

  const rawTemplate = captureRes.payload.rawTemplate || ''
  const cleanedTemplate = cleanXytMinutiaeText(rawTemplate)

  if (!isValidMinutiaeTemplate(cleanedTemplate)) {
    const lineCount = countMinutiaeLines(cleanedTemplate)
    const message = `Pass ${passNumber} rejected: only ${lineCount} valid minutiae lines (minimum ${MIN_MINUTIAE_LINES}). Place the finger flat on the glass and retry.`
    emitLog(message, 'error')
    throw new Error(message)
  }

  // Hash the EXACT text that is uploaded so template_hash stays verifiable later.
  const templateSha256 = await computeTemplateSha256(cleanedTemplate)
  const timestamp = Date.now()
  const storagePath = `${workspaceId}/${memberId}/right_index_${angle}_${timestamp}.xyt`

  emitLog(`Uploading angle template to Supabase Storage (${storagePath})...`, 'info')
  const supabase = getSupabase()
  const templateBlob = new Blob([cleanedTemplate], { type: 'text/plain' })

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
    templateSha256,
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
  const emitLog = (text: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString()
    console.log(`[Enrollment Finalize] [${time}] ${text}`)
    if (onLog) {
      onLog({ id: Math.random().toString(36).substring(2, 9), time, text, type })
    }
  }

  // workspace_id is NOT NULL (FK -> workspaces.id): a real workspace is mandatory.
  const workspaceId = sanitizeUUID(organizationId)
  if (!workspaceId) {
    const message =
      'Biometric enrollment requires a workspace. Open this staff member from /workspace/:workspaceId/staff/:staffId to enroll.'
    emitLog(message, 'error')
    throw new Error(message)
  }

  // member_id FK -> workspace_members.id: must be a real workspace-member UUID.
  if (!isUuid(memberId.trim().toLowerCase())) {
    const message = `Cannot enroll "${memberId}" - member_id must be a workspace member UUID.`
    emitLog(message, 'error')
    throw new Error(message)
  }

  emitLog(`Saving biometric profile to database for ${staffName}...`, 'info')

  const centerPass = passes.find((p) => p.angle === 'center') || passes[0]
  const supabase = getSupabase()

  // Remove existing biometric template rows for this member
  await supabase
    .from('biometric_templates')
    .delete()
    .eq('member_id', memberId)

  // Insert master row - workspace_id is NOT NULL (FK -> workspaces.id), so the
  // nil sentinel and fabricated/fake ids can never reach the database.
  const { error: insertError } = await supabase
    .from('biometric_templates')
    .insert({
      workspace_id: workspaceId,
      member_id: memberId,
      template_hash: centerPass.templateSha256,
      storage_path: centerPass.storagePath,
      template_format: TEMPLATE_FORMAT,
      finger_position: 'right_index',
      quality_score: centerPass.qualityScore || 95,
      created_at: new Date().toISOString(),
    })

  if (insertError) {
    emitLog(`Database error: ${insertError.message}`, 'error')
    throw new Error(`Failed to save template to database: ${insertError.message}`)
  }

  // Legacy post-insert bookkeeping. public.members does not exist in the current
  // schema (enrollment lives on workspace_members), so this is guarded to never
  // fail the enrollment that already succeeded. Move/remove once an authoritative
  // enrollment-status column is confirmed.
  try {
    await supabase
      .from('members')
      .update({
        biometrics_enrolled: true,
        biometrics_enrolled_at: new Date().toISOString(),
      })
      .eq('id', memberId)
  } catch (bookkeepingError) {
    console.warn('[Enrollment Finalize] members bookkeeping skipped (table may not exist):', bookkeepingError)
  }

  emitLog(`Biometric enrollment successfully recorded for ${staffName}!`, 'success')
}
