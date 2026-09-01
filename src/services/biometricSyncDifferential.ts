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
  const supabase = getSupabase()

  try {
    let query = supabase
      .from('biometric_templates')
      .select('id, member_id, storage_path, template_hash, created_at')
      .order('created_at', { ascending: false })

    if (hasWorkspace) {
      query = query.eq('workspace_id', cleanWorkspaceId)
    }

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
 */
export function computeBiometricDifferential(
  cloudSummary: CloudTemplatesSummary,
  localFiles: string[]
): BiometricDifferential {
  const localSet = new Set(localFiles.map((f) => f.toLowerCase().trim()))
  const missingTemplates: CloudTemplateSummaryItem[] = []

  for (const item of cloudSummary.templates) {
    const fn = item.targetFilename.toLowerCase().trim()
    const memberStraight = `${item.memberId.toLowerCase()}_straight.xyt`
    if (!localSet.has(fn) && !localSet.has(memberStraight)) {
      missingTemplates.push(item)
    }
  }

  const cloudFilenames = new Set(
    cloudSummary.templates.map((t) => t.targetFilename.toLowerCase().trim())
  )
  const extraLocalFiles = localFiles.filter(
    (f) => !cloudFilenames.has(f.toLowerCase().trim())
  )

  const inSync = missingTemplates.length === 0 && localFiles.length >= cloudSummary.totalCount

  return {
    inSync,
    diffCount: missingTemplates.length,
    cloudTotal: cloudSummary.totalCount,
    localTotal: localFiles.length,
    missingTemplates,
    extraLocalFiles,
  }
}
