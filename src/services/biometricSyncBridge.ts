import { getResolvedBridgeUrls } from '../config/hardware'
import type { LocalBridgeTemplates } from '../types/biometricSync'

export async function getLocalBridgeTemplates(): Promise<LocalBridgeTemplates> {
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

export async function purgeLocalBridgeTemplates(): Promise<{ success: boolean; deleted: number; error?: string }> {
  const { httpUrl } = getResolvedBridgeUrls()
  try {
    const res = await fetch(`${httpUrl}/api/scanner/templates`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) {
      return { success: false, deleted: 0, error: `Bridge returned status ${res.status}` }
    }
    const data = await res.json()
    return { success: true, deleted: data.deleted || 0 }
  } catch (err) {
    return { success: false, deleted: 0, error: err instanceof Error ? err.message : 'Bridge unreachable' }
  }
}

export async function writeTemplateToBridge(
  memberId: string,
  fileName: string,
  templateContent: string
): Promise<{ success: boolean; error?: string }> {
  const { httpUrl } = getResolvedBridgeUrls()
  try {
    const res = await fetch(`${httpUrl}/api/scanner/sync-template`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberId,
        fileName,
        template: templateContent,
      }),
    })
    if (res.ok) {
      return { success: true }
    }
    return { success: false, error: `Bridge returned ${res.status}` }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}
