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

interface DiscoveredTemplate {
  memberId: string
  storagePath: string
  targetFilename: string
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

  console.log('[BiometricSync] Starting sync with organizationId:', organizationId)

  // 1. Check Local Bridge Gallery
  onProgress?.('Checking local scanner gallery...', 0, 1)
  const localBridge = await getLocalBridgeTemplates()
  if (!localBridge.online) {
    console.warn('[BiometricSync] Node bridge is offline')
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
  console.log(`[BiometricSync] Local gallery has ${localFilesSet.size} template(s):`, localBridge.files)

  const discoveredMap = new Map<string, DiscoveredTemplate>()

  // 2. Query biometric_templates database table
  onProgress?.('Querying database for biometric templates...', 0, 1)
  try {
    let dbQuery = supabase
      .from('biometric_templates')
      .select('id, organization_id, member_id, storage_path, template_hash')

    if (organizationId && organizationId !== '00000000-0000-0000-0000-000000000000') {
      dbQuery = dbQuery.eq('organization_id', organizationId)
    }

    const { data: dbRecords, error: dbError } = await dbQuery
    let records = dbRecords || []

    // If no records found with org filter, fallback to all records
    if ((!records || records.length === 0) && organizationId) {
      console.log('[BiometricSync] No templates found with org filter. Querying all biometric_templates records...')
      const { data: fallbackRecords } = await supabase
        .from('biometric_templates')
        .select('id, organization_id, member_id, storage_path, template_hash')
      if (fallbackRecords && fallbackRecords.length > 0) {
        records = fallbackRecords
      }
    }

    if (dbError) {
      console.warn('[BiometricSync] Database query warning:', dbError.message)
    }

    records.forEach((row) => {
      const memberId = (row.member_id || '').trim()
      const storagePath = (row.storage_path || '').trim()
      if (memberId && storagePath) {
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
      }
    })
    console.log(`[BiometricSync] Found ${discoveredMap.size} template(s) in biometric_templates table`)
  } catch (err) {
    console.warn('[BiometricSync] Error querying biometric_templates table:', err)
  }

  // 3. Discover files directly from Supabase Storage 'biometrics' bucket
  onProgress?.('Scanning Supabase Storage bucket...', 0, 1)
  try {
    const bucketsToCheck = ['biometrics', 'templates', 'minutiae']
    for (const bucket of bucketsToCheck) {
      try {
        const { data: rootFiles } = await supabase.storage.from(bucket).list('', { limit: 100 })
        if (rootFiles && rootFiles.length > 0) {
          for (const item of rootFiles) {
            if (item.name.endsWith('.xyt')) {
              const baseNoExt = item.name.replace(/\.xyt$/i, '')
              const uuidMatch = baseNoExt.match(/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/)
              const memberId = uuidMatch ? uuidMatch[1] : baseNoExt.split('_')[0]
              discoveredMap.set(item.name.toLowerCase(), {
                memberId,
                storagePath: item.name,
                targetFilename: item.name,
              })
            } else if (!item.id && !item.name.includes('.')) {
              // Folder in storage
              try {
                const { data: subFiles } = await supabase.storage.from(bucket).list(item.name, { limit: 50 })
                if (subFiles) {
                  for (const sub of subFiles) {
                    if (sub.name.endsWith('.xyt')) {
                      const baseNoExt = sub.name.replace(/\.xyt$/i, '')
                      const uuidMatch = baseNoExt.match(/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/)
                      const memberId = uuidMatch ? uuidMatch[1] : item.name.includes('-') ? item.name : sub.name.split('_')[0]
                      discoveredMap.set(sub.name.toLowerCase(), {
                        memberId,
                        storagePath: `${item.name}/${sub.name}`,
                        targetFilename: sub.name,
                      })
                    }
                  }
                }
              } catch {
                // Continue subfolder scan
              }
            }
          }
        }
      } catch {
        // Bucket not accessible or does not exist
      }
    }
  } catch (err) {
    console.warn('[BiometricSync] Error listing storage buckets:', err)
  }

  const allTemplates = Array.from(discoveredMap.values())
  const total = allTemplates.length
  console.log(`[BiometricSync] Total cloud biometric templates discovered: ${total}`)

  if (total === 0) {
    return {
      success: true,
      totalCloudTemplates: 0,
      alreadySyncedCount: localFilesSet.size,
      newlySyncedCount: 0,
      failedCount: 0,
      message: 'No enrolled biometric records found in cloud database or storage.',
    }
  }

  let newlySynced = 0
  let alreadySynced = 0
  let failed = 0

  // 4. Download missing templates
  for (let i = 0; i < total; i++) {
    const item = allTemplates[i]
    onProgress?.(`Syncing template ${i + 1}/${total}: ${item.targetFilename}`, i + 1, total)

    if (localFilesSet.has(item.targetFilename.toLowerCase())) {
      alreadySynced++
      continue
    }

    console.log(`[BiometricSync] Downloading missing template: ${item.storagePath} -> ${item.targetFilename}`)

    let textContent = ''

    // Try Download Method A: Supabase SDK download
    try {
      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from('biometrics')
        .download(item.storagePath)

      if (!downloadError && fileBlob) {
        textContent = await fileBlob.text()
      }
    } catch {
      // Try next method
    }

    // Try Download Method B: Public URL fetch if SDK download didn't return text
    if (!textContent || textContent.trim().length === 0) {
      try {
        const { data: pubData } = supabase.storage.from('biometrics').getPublicUrl(item.storagePath)
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

    if (!textContent || textContent.trim().length === 0) {
      console.warn(`[BiometricSync] Failed to download content for ${item.storagePath}`)
      failed++
      continue
    }

    // Send downloaded template to Node Bridge
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
        console.log(`[BiometricSync] Saved to local gallery: ${item.targetFilename}`)
        newlySynced++
        localFilesSet.add(item.targetFilename.toLowerCase())
      } else {
        console.warn(`[BiometricSync] Bridge rejected template ${item.targetFilename}: status ${syncRes.status}`)
        failed++
      }
    } catch (err) {
      console.warn(`[BiometricSync] Error posting template to bridge:`, err)
      failed++
    }
  }

  const message = newlySynced > 0
    ? `Successfully downloaded ${newlySynced} new template(s). Total in local gallery: ${localFilesSet.size}.`
    : `All ${total} template(s) are already synchronized with local storage.`

  console.log('[BiometricSync] Sync completed result:', { total, newlySynced, alreadySynced, failed })

  return {
    success: true,
    totalCloudTemplates: total,
    alreadySyncedCount: alreadySynced,
    newlySyncedCount: newlySynced,
    failedCount: failed,
    message,
  }
}
