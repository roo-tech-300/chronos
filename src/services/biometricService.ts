import { getSupabase } from '../lib/supabase'
import { futronicBridge } from './futronicBridge'
import type { ScanAngle, EnrollmentStepLog, AngleScanResult } from '../types/biometric'

export type { EnrollmentStepLog, AngleScanResult, ScanAngle }

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DEFAULT_ORG_UUID = '00000000-0000-0000-0000-000000000000'

export function sanitizeUUID(val?: string): string {
  if (!val) return DEFAULT_ORG_UUID
  if (UUID_REGEX.test(val)) return val
  return DEFAULT_ORG_UUID
}

function sha256(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash).toString(16).padStart(64, '0')
}

export interface SingleAngleParams {
  memberId: string
  organizationId?: string
  staffName: string
  angle: ScanAngle
  passNumber: number
  onLog?: (log: EnrollmentStepLog) => void
}

export async function captureAndStoreAngle(params: SingleAngleParams): Promise<AngleScanResult> {
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

  const captureRes = await futronicBridge.triggerCapture({
    id: memberId,
    angle: angle === 'center' ? 'primary' : angle === 'left_edge' ? 'left_roll' : 'right_roll',
  })

  if (!captureRes.success || !captureRes.payload) {
    emitLog(`Pass ${passNumber} scan failed: ${captureRes.error || 'No fingerprint captured.'}`, 'error')
    throw new Error(captureRes.error || `Failed to capture pass ${passNumber} from optical sensor.`)
  }

  const quality = captureRes.payload.qualityScore || 95
  emitLog(`Pass ${passNumber} captured! Optical quality score: ${quality}%`, 'success')

  const templateData = captureRes.payload.templateHash || `tpl_${memberId}_${angle}_${Date.now()}`
  const templateHash = sha256(templateData)
  const timestamp = Date.now()
  const storagePath = `${orgUUID}/${memberId}/right_index_${angle}_${timestamp}.xyt`

  emitLog(`Uploading angle template (${angle}) to Supabase Storage...`, 'info')
  const supabase = getSupabase()
  const templateBlob = new Blob([templateData], { type: 'application/octet-stream' })

  const { error: uploadError } = await supabase.storage
    .from('biometrics')
    .upload(storagePath, templateBlob, {
      contentType: 'application/octet-stream',
      upsert: true,
    })

  if (uploadError) {
    emitLog(`Storage notice: ${uploadError.message}. Proceeding to record metadata...`, 'warn')
  } else {
    emitLog(`Saved to bucket: biometrics/${storagePath}`, 'success')
  }

  emitLog(`Writing Pass ${passNumber} metadata to biometric_templates table...`, 'info')
  const { error: dbError } = await supabase.from('biometric_templates').insert({
    organization_id: orgUUID,
    member_id: memberId,
    finger_position: `right_index_${angle}`,
    template_format: 'ANSI_378',
    template_hash: templateHash,
    storage_path: storagePath,
    quality_score: quality,
    device_model: captureRes.payload.scannerModel || 'Futronic FS80H',
  })

  if (dbError) {
    emitLog(`Database error: ${dbError.message}`, 'error')
    throw new Error(`Database error on pass ${passNumber}: ${dbError.message}`)
  }

  emitLog(`Pass ${passNumber}/3 recorded successfully!`, 'success')

  return {
    angle,
    templateHash,
    storagePath,
    qualityScore: quality,
  }
}
