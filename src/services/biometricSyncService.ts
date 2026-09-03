import {
  getLocalBridgeTemplates,
  purgeLocalBridgeTemplates,
} from './biometricSyncBridge'
import {
  fetchCloudTemplatesSummary,
  computeBiometricDifferential,
} from './biometricSyncDifferential'
import { isRealWorkspaceUuid } from '../utils/uuid'
import { syncSingleTemplate } from './biometricSyncDownloader'
import type {
  BiometricSyncResult,
  BiometricDifferential,
  SyncProgressCallback,
} from '../types/biometricSync'

export { getLocalBridgeTemplates, purgeLocalBridgeTemplates, fetchCloudTemplatesSummary }
export type { BiometricSyncResult, BiometricDifferential, SyncProgressCallback }

/**
 * Fast, lightweight check for Kiosk navigation.
 * Compares Cloud metadata (counts, filenames) with Local Bridge without downloading files.
 */
export async function checkBiometricSyncStatus(
  workspaceId?: string
): Promise<{ bridgeOnline: boolean; differential: BiometricDifferential; dataDir?: string }> {
  const localBridge = await getLocalBridgeTemplates()
  if (!localBridge.online) {
    return {
      bridgeOnline: false,
      dataDir: localBridge.dataDir,
      differential: {
        inSync: false,
        diffCount: 0,
        cloudTotal: 0,
        localTotal: 0,
        missingTemplates: [],
        extraLocalFiles: [],
      },
    }
  }

  const cloudSummary = await fetchCloudTemplatesSummary(workspaceId)
  const differential = computeBiometricDifferential(cloudSummary, localBridge.files, localBridge.fileHashes)

  return {
    bridgeOnline: true,
    dataDir: localBridge.dataDir,
    differential,
  }
}

/**
 * Synchronizes templates with the cloud database (the source of truth).
 * If force=true: Purges local gallery first, then re-downloads everything from the database.
 * If force=false: Delta sync - checks difference, skips if up to date, downloads only missing.
 */
export async function syncBiometricTemplates(
  workspaceId?: string,
  onProgress?: SyncProgressCallback,
  force = false
): Promise<BiometricSyncResult> {
  const cleanWorkspaceId = (workspaceId || '').trim().toLowerCase()
  console.log(`[BiometricSync] Starting ${force ? 'FORCE ' : ''}sync for workspace:`, cleanWorkspaceId)

  if (!cleanWorkspaceId || !isRealWorkspaceUuid(cleanWorkspaceId)) {
    return {
      success: false,
      totalCloudTemplates: 0,
      alreadySyncedCount: 0,
      newlySyncedCount: 0,
      failedCount: 0,
      message: 'This kiosk is not tied to a valid workspace. Pair the terminal to a workspace before syncing biometric templates.',
      error: 'Missing workspaceId',
    }
  }

  // 1. Check Local Bridge
  onProgress?.('Connecting to local scanner bridge...', 0, 1)
  const localBridge = await getLocalBridgeTemplates()
  if (!localBridge.online) {
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

  let purgedCount = 0

  // 2. Handle Force Sync: Delete local gallery completely
  if (force) {
    onProgress?.('Purging local template cache for full fresh sync...', 0, 1)
    const purgeRes = await purgeLocalBridgeTemplates()
    purgedCount = purgeRes.deleted
    console.log(`[BiometricSync] Force sync purged ${purgedCount} local file(s)`)
  }

  // 3. Fetch Cloud Templates Summary
  onProgress?.('Fetching biometric templates from database...', 0, 1)
  const cloudSummary = await fetchCloudTemplatesSummary(workspaceId)
  const totalCloud = cloudSummary.totalCount

  if (totalCloud === 0) {
    return {
      success: true,
      totalCloudTemplates: 0,
      alreadySyncedCount: 0,
      newlySyncedCount: 0,
      failedCount: 0,
      purgedLocalCount: purgedCount,
      dataDir: localBridge.dataDir,
      message: 'No enrolled biometric records found in cloud database.',
    }
  }

  // 4. Compute Differential
  const currentLocal = force ? { files: [], fileHashes: {} } : await getLocalBridgeTemplates()
  const differential = computeBiometricDifferential(cloudSummary, currentLocal.files, currentLocal.fileHashes)

  // If already up-to-date and not forced, skip!
  if (!force && differential.inSync) {
    console.log(`[BiometricSync] Local gallery is already in sync with cloud (${totalCloud} templates) - Skipping download.`)
    return {
      success: true,
      totalCloudTemplates: totalCloud,
      alreadySyncedCount: totalCloud,
      newlySyncedCount: 0,
      failedCount: 0,
      dataDir: localBridge.dataDir,
      message: `All ${totalCloud} cloud template(s) are already synchronized locally.`,
    }
  }

  // 5. Download missing templates
  const toDownload = force ? cloudSummary.templates : differential.missingTemplates
  let newlySynced = 0
  let failed = 0

  for (let i = 0; i < toDownload.length; i++) {
    const item = toDownload[i]
    onProgress?.(`Downloading ${i + 1}/${toDownload.length}: ${item.targetFilename}`, i + 1, toDownload.length)

    const ok = await syncSingleTemplate(item)
    if (ok) {
      newlySynced++
    } else {
      failed++
    }
  }

  const alreadySynced = force ? 0 : totalCloud - toDownload.length

  // 6. Verification & Audit Check
  onProgress?.('Verifying local template inventory against cloud database...', totalCloud, totalCloud)
  const finalLocal = await getLocalBridgeTemplates()
  const postDifferential = computeBiometricDifferential(cloudSummary, finalLocal.files, finalLocal.fileHashes)

  console.log('[BiometricSync] Post-Sync Audit Log:', {
    workspaceId,
    cloudTotal: totalCloud,
    localTotal: finalLocal.files.length,
    newlySynced,
    failed,
    purgedCount,
    verifiedInSync: postDifferential.inSync,
  })

  const verified = postDifferential.inSync || finalLocal.files.length >= totalCloud
  const message = force
    ? verified
      ? `Force Sync verified: Purged local cache and successfully hydrated all ${newlySynced} template(s) from database.`
      : `Force Sync completed with discrepancies: ${newlySynced}/${totalCloud} downloaded (${failed} failed).`
    : newlySynced > 0
    ? `Successfully synchronized ${newlySynced} template(s) from database.`
    : `All ${totalCloud} cloud template(s) are up to date.`

  return {
    success: verified || newlySynced > 0,
    totalCloudTemplates: totalCloud,
    alreadySyncedCount: alreadySynced,
    newlySyncedCount: newlySynced,
    failedCount: failed,
    purgedLocalCount: purgedCount,
    dataDir: localBridge.dataDir,
    message,
  }
}
