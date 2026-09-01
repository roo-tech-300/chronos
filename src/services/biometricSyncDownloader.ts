import { getSupabase } from '../lib/supabase'
import { writeTemplateToBridge } from './biometricSyncBridge'
import type { CloudTemplateSummaryItem } from '../types/biometricSync'

export async function downloadTemplateContent(item: CloudTemplateSummaryItem): Promise<string> {
  const supabase = getSupabase()
  let textContent = ''
  let bucketName = 'biometrics'
  let filePathInBucket = item.storagePath

  if (item.storagePath.includes('::')) {
    const parts = item.storagePath.split('::')
    bucketName = parts[0]
    filePathInBucket = parts[1]
  }

  // 1. Supabase Storage SDK download
  if (filePathInBucket) {
    try {
      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from(bucketName)
        .download(filePathInBucket)

      if (!downloadError && fileBlob) {
        textContent = await fileBlob.text()
      }
    } catch {
      // Fallback
    }

    // 2. Public URL fallback
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
        // Fallback
      }
    }
  }

  return textContent.trim()
}

export async function syncSingleTemplate(item: CloudTemplateSummaryItem): Promise<boolean> {
  const content = await downloadTemplateContent(item)
  if (!content) {
    console.warn(`[BiometricSync] Empty template content for ${item.targetFilename}`)
    return false
  }

  const res = await writeTemplateToBridge(item.memberId, item.targetFilename, content)
  return res.success
}
