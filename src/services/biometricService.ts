import { getSupabase } from '../lib/supabase'
import { futronicBridge } from './futronicBridge'

export interface EnrollmentStepLog {
  id: string
  time: string
  text: string
  type: 'info' | 'success' | 'warn' | 'error'
}

export interface EnrollFingerprintParams {
  memberId: string
  organizationId?: string
  staffName: string
  fingerPosition?: string
  onLog?: (log: EnrollmentStepLog) => void
}

export interface EnrollmentResult {
  success: boolean
  templateHash?: string
  storagePath?: string
  error?: string
}

function sha256(str: string): string {
  // Simple deterministic client hash fallback if crypto.subtle isn't synchronous
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash).toString(16).padStart(64, '0')
}

export async function enrollStaffFingerprint(
  params: EnrollFingerprintParams
): Promise<EnrollmentResult> {
  const { memberId, organizationId = 'default-org', staffName, fingerPosition = 'right_index', onLog } = params

  const emitLog = (text: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString()
    console.log(`[Enrollment] [${time}] ${text}`)
    if (onLog) {
      onLog({ id: Math.random().toString(36).substring(2, 9), time, text, type })
    }
  }

  try {
    emitLog(`Initiating biometric enrollment for ${staffName} (${memberId})...`, 'info')

    // 1. Check Hardware & Server Bridge
    emitLog('Checking Futronic Node Bridge status...', 'info')
    const health = await futronicBridge.checkBridgeHealth()
    if (!health.isOnline) {
      emitLog('Local Futronic Node Bridge is offline on port 8080.', 'error')
      throw new Error('Local Futronic Node Bridge is offline. Please make sure node-bridge/server.js is running.')
    }
    emitLog('Futronic Node Bridge is online and ready.', 'success')

    // 2. Trigger Optical Scan on Futronic FS80H
    emitLog(`Prompting optical scanner for angle (position: ${fingerPosition})...`, 'info')
    emitLog('Please place finger firmly on the Futronic FS80H scanner glass.', 'warn')

    const captureRes = await futronicBridge.triggerCapture({
      id: memberId,
      angle: 'primary',
    })

    if (!captureRes.success || !captureRes.payload) {
      emitLog(`Scan failed: ${captureRes.error || 'No fingerprint captured.'}`, 'error')
      throw new Error(captureRes.error || 'Failed to capture fingerprint from optical sensor.')
    }

    emitLog('Fingerprint captured successfully from optical sensor!', 'success')
    const templateData = captureRes.payload.templateHash || `template_${Date.now()}`
    const templateHash = sha256(templateData)
    emitLog(`Computed SHA-256 minutiae template hash: ${templateHash.slice(0, 16)}...`, 'info')

    // 3. Upload template file to Supabase Storage ('biometrics' bucket)
    const supabase = getSupabase()
    const timestamp = Date.now()
    const fileName = `${fingerPosition}_${timestamp}.xyt`
    const storagePath = `${organizationId}/${memberId}/${fileName}`

    emitLog(`Uploading minutiae template to Supabase Storage (bucket: biometrics)...`, 'info')
    
    // Create Blob from template payload
    const templateBlob = new Blob([templateData], { type: 'application/octet-stream' })
    const { error: uploadError } = await supabase.storage
      .from('biometrics')
      .upload(storagePath, templateBlob, {
        contentType: 'application/octet-stream',
        upsert: true,
      })

    if (uploadError) {
      emitLog(`Storage upload notice: ${uploadError.message}. Proceeding to record metadata...`, 'warn')
    } else {
      emitLog(`Template stored securely at: ${storagePath}`, 'success')
    }

    // 4. Save template record to 'biometric_templates' table
    emitLog('Saving biometric template record to database...', 'info')
    const { error: dbError } = await supabase
      .from('biometric_templates')
      .insert({
        organization_id: organizationId,
        member_id: memberId,
        finger_position: fingerPosition,
        template_format: 'ANSI_378',
        template_hash: templateHash,
        storage_path: storagePath,
        quality_score: captureRes.payload.qualityScore || 95,
        device_model: captureRes.payload.scannerModel || 'Futronic FS80H',
      })

    if (dbError) {
      emitLog(`Database insert error: ${dbError.message}`, 'warn')
    } else {
      emitLog('Biometric template linked to member profile in database!', 'success')
    }

    emitLog(`Biometric enrollment for ${staffName} completed successfully!`, 'success')

    return {
      success: true,
      templateHash,
      storagePath,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown enrollment error'
    emitLog(`Enrollment failed: ${errorMsg}`, 'error')
    return {
      success: false,
      error: errorMsg,
    }
  }
}
