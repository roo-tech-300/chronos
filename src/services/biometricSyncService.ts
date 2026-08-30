import { getSupabase } from '../lib/supabase'
import { getResolvedBridgeUrls } from '../config/hardware'

export interface SyncProgressCallback {
  (message: string, current: number, total: number): void
}

export interface BiometricSyncResult {
  success: boolean
  totalCloudTemplates: number
  alreadySyncedCount: number
  newlySyncedCount: number
  failedCount: number
  message: string
  error?: string
}

export async function getLocalBridgeTemplates(): Promise<{
  online: boolean
  files: string[]
  memberIds: string[]
  error?: string
}> {
  const { httpUrl } = getResolvedBridgeUrls()
  try {
    const res = await fetch(`${httpUrl}/api/scanner/templates`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) {
      return { online: false, files: [], memberIds: [], error: `Bridge returned status ${res.status}` }
    }
    const data = await res.json()
    return {
      online: true,
      files: Array.isArray(data.files) ? data.files : [],
      memberIds: Array.isArray(data.memberIds) ? data.memberIds : Array.isArray(data.studentIds) ? data.studentIds : [],
    }
  } catch (err) {
    return {
      online: false,
      files: [],
      memberIds: [],
      error: err instanceof Error ? err.message : 'Cannot connect to Node Bridge on 127.0.0.1:8080',
    }
  }
}

/**
 * Downloads missing biometric minutiae templates (.xyt) from Supabase Storage
 * and writes them directly into the local Node Bridge template directory (.db/minut or AppData).
 */
export async function syncBiometricTemplates(
  organizationId?: string,
  onProgress?: SyncProgressCallback
): Promise<BiometricSyncResult> {
  const supabase = getSupabase()
  const { httpUrl } = getResolvedBridgeUrls()

  // 1. Check Local Bridge Gallery
  onProgress?.('Checking local scanner gallery...', 0, 1)
  const localBridge = await getLocalBridgeTemplates()
  if (!localBridge.online) {
    return {
      success: false,
      totalCloudTemplates: 0,
      alreadySyncedCount: 0,
      newlySyncedCount: 0,
      failedCount: 0,
      message: 'Node Bridge is offline. Ensure the Chronos Windows app/bridge is running on 127.0.0.1:8080.',
      error: localBridge.error,
    }
  }

  const localFilesSet = new Set(localBridge.files.map((f) => f.toLowerCase()))

  // 2. Fetch Enrolled Templates from Supabase
  onProgress?.('Querying database biometric templates...', 0, 1)
  let query = supabase.from('biometric_templates').select('id, organization_id, member_id, storage_path, template_hash')
  if (organizationId && organizationId !== '00000000-0000-0000-0000-000000000000') {
    query = query.eq('organization_id', organizationId)
  }

  const { data: cloudRecords, error: dbError } = await query
  if (dbError) {
    return {
      success: false,
      totalCloudTemplates: 0,
      alreadySyncedCount: localFilesSet.size,
      newlySyncedCount: 0,
      failedCount: 0,
      message: `Database query failed: ${dbError.message}`,
      error: dbError.message,
    }
  }

  const templates = cloudRecords || []
  const total = templates.length

  if (total === 0) {
    return {
      success: true,
      totalCloudTemplates: 0,
      alreadySyncedCount: localFilesSet.size,
      newlySyncedCount: 0,
      failedCount: 0,
      message: 'No enrolled biometric records found in cloud database for this workspace.',
    }
  }

  let newlySynced = 0
  let alreadySynced = 0
  let failed = 0

  // 3. Process each record
  for (let i = 0; i < total; i++) {
    const row = templates[i]
    const memberId = row.member_id
    const storagePath = row.storage_path

    onProgress?.(`Processing template ${i + 1}/${total}...`, i + 1, total)

    if (!storagePath) {
      failed++
      continue
    }

    // Determine target local filename (e.g., "<member_id>_straight.xyt")
    const pathParts = storagePath.split('/')
    const originalFilename = pathParts[pathParts.length - 1]
    const localTargetFilename = originalFilename.includes(memberId)
      ? originalFilename
      : `${memberId}_straight.xyt`

    // Check if already present locally
    if (localFilesSet.has(localTargetFilename.toLowerCase())) {
      alreadySynced++
      continue
    }

    // Download from Supabase Storage
    try {
      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from('biometrics')
        .download(storagePath)

      if (downloadError || !fileBlob) {
        console.warn(`[Sync] Could not download storage file ${storagePath}:`, downloadError?.message)
        failed++
        continue
      }

      const textContent = await fileBlob.text()
      if (!textContent || textContent.trim().length === 0) {
        failed++
        continue
      }

      // Send to local Node Bridge
      const syncRes = await fetch(`${httpUrl}/api/scanner/sync-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          fileName: localTargetFilename,
          template: textContent,
        }),
      })

      if (syncRes.ok) {
        newlySynced++
        localFilesSet.add(localTargetFilename.toLowerCase())
      } else {
        failed++
      }
    } catch (err) {
      console.warn(`[Sync] Error syncing template for ${memberId}:`, err)
      failed++
    }
  }

  const message = newlySynced > 0
    ? `Successfully synced ${newlySynced} new template(s) from database. Total in local gallery: ${localFilesSet.size}.`
    : `All ${total} database template(s) are already synchronized with local storage.`

  return {
    success: true,
    totalCloudTemplates: total,
    alreadySyncedCount: alreadySynced,
    newlySyncedCount: newlySynced,
    failedCount: failed,
    message,
  }
}
