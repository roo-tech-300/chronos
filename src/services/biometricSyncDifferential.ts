import { getSupabase } from '../lib/supabase'
import { isRealWorkspaceUuid } from '../utils/uuid'
import type {
  CloudTemplateSummaryItem,
  CloudTemplatesSummary,
  BiometricDifferential,
} from '../types/biometricSync'

/**
 * Fetches lightweight synchronization summary directly from Supabase.
 * The database is the authoritative source of truth.
 */
export async function fetchCloudTemplatesSummary(workspaceId?: string): Promise<CloudTemplatesSummary> {
  const cleanWorkspaceId = (workspaceId || '').trim().toLowerCase()
  const hasWorkspace = isRealWorkspaceUuid(cleanWorkspaceId)

  // A kiosk sync must always target a specific workspace. Querying the whole cloud
  // dataset here creates false positives like "all 1 template(s) are up to date"
  // when the bridge is actually unbound or attached to a different workspace.
  if (!hasWorkspace) {
    return { workspaceId: cleanWorkspaceId, totalCount: 0, latestCreatedAt: null, templates: [] }
  }

  const supabase = getSupabase()

  try {
    const query = supabase
      .from('biometric_templates')
      .select('id, member_id, storage_path, template_hash, created_at')
      .eq('workspace_id', cleanWorkspaceId)
      .order('created_at', { ascending: false })

    const { data: dbRecords, error: dbError } = await query

    if (dbError) {
      console.warn('[BiometricSync] Cloud summary query note:', dbError.message)
      return { workspaceId: cleanWorkspaceId, totalCount: 0, latestCreatedAt: null, templates: [] }
    }

    const templates: CloudTemplateSummaryItem[] = []
    let latestCreatedAt: string | null = null

    if (dbRecords && dbRecords.length > 0) {
      latestCreatedAt = dbRecords[0].created_at || null

      for (const row of dbRecords) {
        const memberId = (row.member_id || '').trim()
        const storagePath = (row.storage_path || '').trim()
        if (!memberId) continue

        let targetFilename = `${memberId}_straight.xyt`
        if (storagePath) {
          const parts = storagePath.split('/')
          const originalFilename = parts[parts.length - 1]
          targetFilename = originalFilename.includes(memberId)
            ? originalFilename
            : `${memberId}_straight.xyt`
        }

        templates.push({
          id: row.id,
          memberId,
          storagePath,
          templateHash: row.template_hash || '',
          targetFilename,
          createdAt: row.created_at,
        })
      }
    }

    return {
      workspaceId: cleanWorkspaceId,
      totalCount: templates.length,
      latestCreatedAt,
      templates,
    }
  } catch (err) {
    console.warn('[BiometricSync] Failed to fetch cloud summary:', err)
    return { workspaceId: cleanWorkspaceId, totalCount: 0, latestCreatedAt: null, templates: [] }
  }
}

/**
 * Computes exact difference between Cloud (source of truth) and Local Bridge Gallery.
 * A local file is considered "in sync" only when it exists AND its SHA-256 matches
 * the cloud template_hash — stale or corrupted files are flagged for re-download.
 */
export function computeBiometricDifferential(
  cloudSummary: CloudTemplatesSummary,
  localFiles: string[],
  localHashes: Record<string, string> = {}
): BiometricDifferential {
  const localSet = new Set(localFiles.map((f) => f.toLowerCase().trim()))
  const localHashesLower: Record<string, string> = {}
  for (const [k, v] of Object.entries(localHashes)) {
    localHashesLower[k.toLowerCase().trim()] = v.toLowerCase().trim()
  }
  const missingTemplates: CloudTemplateSummaryItem[] = []

  for (const item of cloudSummary.templates) {
    const fn = item.targetFilename.toLowerCase().trim()
    const memberStraight = `${item.memberId.toLowerCase()}_straight.xyt`
    const localFn = localSet.has(fn) ? fn : localSet.has(memberStraight) ? memberStraight : null

    if (!localFn) {
      // File missing entirely — needs download
      missingTemplates.push(item)
    } else if (item.templateHash) {
      // File exists — verify content matches cloud hash
      const localHash = localHashesLower[localFn]
      if (localHash !== item.templateHash.toLowerCase()) {
        missingTemplates.push(item)
      }
    }
    // If file exists but cloud has no hash recorded, trust the filename match
  }

  const cloudFilenames = new Set(
    cloudSummary.templates.map((t) => t.targetFilename.toLowerCase().trim())
  )
  const extraLocalFiles = localFiles.filter(
    (f) => !cloudFilenames.has(f.toLowerCase().trim())
  )

  // In sync only when nothing is missing AND no extra local files exist
  const inSync = missingTemplates.length === 0 && extraLocalFiles.length === 0

  return {
    inSync,
    diffCount: missingTemplates.length,
    cloudTotal: cloudSummary.totalCount,
    localTotal: localFiles.length,
    missingTemplates,
    extraLocalFiles,
  }
}
