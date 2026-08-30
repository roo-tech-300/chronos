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
  dataDir?: string
  message: string
  error?: string
}

export async function getLocalBridgeTemplates(): Promise<{
  online: boolean
  files: string[]
  memberIds: string[]
  dataDir?: string
  error?: string
}> {
  const { httpUrl } = getResolvedBridgeUrls()
  try {
    const healthRes = await fetch(`${httpUrl}/api/health`).catch(() => null)
    const healthData = healthRes && healthRes.ok ? await healthRes.json() : null

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
      dataDir: healthData?.dataDir || '',
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

interface DiscoveredTemplate {
  memberId: string
  storagePath: string
  targetFilename: string
}

/**
 * Downloads missing biometric minutiae templates (.xyt) from Supabase Storage
 * and writes them directly into %LOCALAPPDATA%\Chronos\data\minut (dynamic across all PCs).
 */
export async function syncBiometricTemplates(
  organizationId?: string,
  onProgress?: SyncProgressCallback
): Promise<BiometricSyncResult> {
  const supabase = getSupabase()
  const { httpUrl } = getResolvedBridgeUrls()

  console.log('[BiometricSync] Starting sync for organization:', organizationId)

  // 1. Check Local Bridge Gallery
  onProgress?.('Connecting to local scanner bridge...', 0, 1)
  const localBridge = await getLocalBridgeTemplates()
  if (!localBridge.online) {
    console.warn('[BiometricSync] Node bridge is offline')
    return {
      success: false,
      totalCloudTemplates: 0,
      alreadySyncedCount: 0,
      newlySyncedCount: 0,
      failedCount: 0,
      message: 'Local Node Bridge is offline on 127.0.0.1:8080. Start node-bridge or the Chronos app first.',
      error: localBridge.error,
    }
  }

  const localFilesSet = new Set(localBridge.files.map((f) => f.toLowerCase()))
  console.log(`[BiometricSync] Local gallery path: ${localBridge.dataDir || 'AppData/Local/Chronos/data/minut'}, files found: ${localFilesSet.size}`)

  const discoveredMap = new Map<string, DiscoveredTemplate>()

  // 2. Query database table: biometric_templates
  onProgress?.('Fetching biometric templates from database...', 0, 1)
  try {
    const { data: dbRecords, error: dbError } = await supabase
      .from('biometric_templates')
      .select('id, organization_id, member_id, storage_path, template_hash, finger_position')

    if (dbError) {
      console.warn('[BiometricSync] Database query note:', dbError.message)
    }

    if (dbRecords && dbRecords.length > 0) {
      for (const row of dbRecords) {
        const memberId = (row.member_id || '').trim()
        const storagePath = (row.storage_path || '').trim()
        if (!memberId) continue

        if (storagePath) {
          const parts = storagePath.split('/')
          const originalFilename = parts[parts.length - 1]
          const targetFilename = originalFilename.includes(memberId)
            ? originalFilename
            : `${memberId}_straight.xyt`
          discoveredMap.set(targetFilename.toLowerCase(), {
            memberId,
            storagePath,
            targetFilename,
          })
        } else if (row.template_hash) {
          // If stored inline as template_hash
          discoveredMap.set(`${memberId}_straight.xyt`.toLowerCase(), {
            memberId,
            storagePath: '',
            targetFilename: `${memberId}_straight.xyt`,
          })
        }
      }
    }
  } catch (err) {
    console.warn('[BiometricSync] Table query error:', err)
  }

  // 3. Scan Supabase Storage buckets directly for any uploaded .xyt templates
  onProgress?.('Scanning Supabase Storage buckets...', 0, 1)
  const bucketsToScan = ['biometrics', 'templates', 'minutiae']
  for (const bucket of bucketsToScan) {
    try {
      const { data: topLevel } = await supabase.storage.from(bucket).list('', { limit: 200 })
      if (!topLevel || topLevel.length === 0) continue

      for (const item of topLevel) {
        if (item.name.endsWith('.xyt')) {
          const baseNoExt = item.name.replace(/\.xyt$/i, '')
          const uuidMatch = baseNoExt.match(/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/)
          const memberId = uuidMatch ? uuidMatch[1] : baseNoExt.split('_')[0]
          discoveredMap.set(item.name.toLowerCase(), {
            memberId,
            storagePath: `${bucket}::${item.name}`,
            targetFilename: item.name,
          })
        } else if (!item.id && !item.name.includes('.')) {
          // Subfolder scan (e.g. orgId/ or memberId/)
          try {
            const { data: subItems } = await supabase.storage.from(bucket).list(item.name, { limit: 100 })
            if (subItems) {
              for (const sub of subItems) {
                if (sub.name.endsWith('.xyt')) {
                  const baseNoExt = sub.name.replace(/\.xyt$/i, '')
                  const uuidMatch = baseNoExt.match(/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/)
                  const memberId = uuidMatch ? uuidMatch[1] : item.name.length > 20 ? item.name : sub.name.split('_')[0]
                  discoveredMap.set(sub.name.toLowerCase(), {
                    memberId,
                    storagePath: `${bucket}::${item.name}/${sub.name}`,
                    targetFilename: sub.name,
                  })
                } else if (!sub.id && !sub.name.includes('.')) {
                  // Nested subfolder (e.g. orgId/memberId/)
                  try {
                    const { data: nestedItems } = await supabase.storage.from(bucket).list(`${item.name}/${sub.name}`, { limit: 50 })
                    if (nestedItems) {
                      for (const nest of nestedItems) {
                        if (nest.name.endsWith('.xyt')) {
                          const baseNoExt = nest.name.replace(/\.xyt$/i, '')
                          const uuidMatch = baseNoExt.match(/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/)
                          const memberId = uuidMatch ? uuidMatch[1] : sub.name.length > 20 ? sub.name : item.name
                          discoveredMap.set(nest.name.toLowerCase(), {
                            memberId,
                            storagePath: `${bucket}::${item.name}/${sub.name}/${nest.name}`,
                            targetFilename: nest.name,
                          })
                        }
                      }
                    }
                  } catch {
                    // Continue
                  }
                }
              }
            }
          } catch {
            // Continue
          }
        }
      }
    } catch {
      // Continue bucket search
    }
  }

  const allTemplates = Array.from(discoveredMap.values())
  const total = allTemplates.length
  console.log(`[BiometricSync] Discovered total ${total} cloud template(s):`, allTemplates)

  if (total === 0) {
    return {
      success: true,
      totalCloudTemplates: 0,
      alreadySyncedCount: localFilesSet.size,
      newlySyncedCount: 0,
      failedCount: 0,
      dataDir: localBridge.dataDir,
      message: 'No enrolled biometric records found in cloud database or Supabase storage.',
    }
  }

  let newlySynced = 0
  let alreadySynced = 0
  let failed = 0

  // 4. Download and write each template into local storage via bridge
  for (let i = 0; i < total; i++) {
    const item = allTemplates[i]
    onProgress?.(`Downloading ${i + 1}/${total}: ${item.targetFilename}`, i + 1, total)

    if (localFilesSet.has(item.targetFilename.toLowerCase())) {
      alreadySynced++
      continue
    }

    let textContent = ''
    let bucketName = 'biometrics'
    let filePathInBucket = item.storagePath

    if (item.storagePath.includes('::')) {
      const parts = item.storagePath.split('::')
      bucketName = parts[0]
      filePathInBucket = parts[1]
    }

    // Method A: Supabase Storage SDK download
    if (filePathInBucket) {
      try {
        const { data: fileBlob, error: downloadError } = await supabase.storage
          .from(bucketName)
          .download(filePathInBucket)

        if (!downloadError && fileBlob) {
          textContent = await fileBlob.text()
        }
      } catch (err) {
        console.warn(`[BiometricSync] SDK download failed for ${filePathInBucket}:`, err)
      }

      // Method B: Public URL fetch
      if (!textContent || textContent.trim().length === 0) {
        try {
          const { data: pubData } = supabase.storage.from(bucketName).getPublicUrl(filePathInBucket)
          if (pubData?.publicUrl) {
            const fetchRes = await fetch(pubData.publicUrl)
            if (fetchRes.ok) {
              textContent = await fetchRes.text()
            }
          }
        } catch {
          // Continue
        }
      }
    }

    if (!textContent || textContent.trim().length === 0) {
      console.warn(`[BiometricSync] Empty template content for ${item.targetFilename}`)
      failed++
      continue
    }

    // Method C: Write directly to Node Bridge
    try {
      const syncRes = await fetch(`${httpUrl}/api/scanner/sync-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: item.memberId,
          fileName: item.targetFilename,
          template: textContent,
        }),
      })

      if (syncRes.ok) {
        console.log(`[BiometricSync] Successfully written to local AppData: ${item.targetFilename}`)
        newlySynced++
        localFilesSet.add(item.targetFilename.toLowerCase())
      } else {
        console.warn(`[BiometricSync] Bridge rejected template ${item.targetFilename} (Status: ${syncRes.status})`)
        failed++
      }
    } catch (err) {
      console.warn(`[BiometricSync] Network error posting to bridge for ${item.targetFilename}:`, err)
      failed++
    }
  }

  const message = newlySynced > 0
    ? `Successfully downloaded ${newlySynced} template(s) to ${localBridge.dataDir || 'AppData\\Local\\Chronos\\data\\minut'}. Total active files: ${localFilesSet.size}.`
    : `All ${total} cloud template(s) are already synchronized in ${localBridge.dataDir || 'AppData\\Local\\Chronos\\data\\minut'}.`

  console.log('[BiometricSync] Finished sync result:', { total, newlySynced, alreadySynced, failed })

  return {
    success: true,
    totalCloudTemplates: total,
    alreadySyncedCount: alreadySynced,
    newlySyncedCount: newlySynced,
    failedCount: failed,
    dataDir: localBridge.dataDir,
    message,
  }
}
