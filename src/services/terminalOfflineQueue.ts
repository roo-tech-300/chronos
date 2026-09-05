import { getSupabase } from '../lib/supabase'
import type { LogAttendanceParams } from '../types/attendance'

const QUEUE_KEY = 'chronos_offline_scans_queue'

/** Maximum replay attempts before a scan is treated as a poison item and dropped. */
const MAX_FLUSH_ATTEMPTS = 5

export interface QueuedOfflineScan {
  id: string
  params: LogAttendanceParams
  queuedAt: string
  /** Number of failed replay attempts (undefined = never attempted). */
  attempts?: number
}

export function getOfflineQueue(): QueuedOfflineScan[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getOfflineQueueCount(): number {
  return getOfflineQueue().length
}

export function enqueueOfflineScan(params: LogAttendanceParams): QueuedOfflineScan {
  const queue = getOfflineQueue()
  const item: QueuedOfflineScan = {
    id: `off_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    params,
    queuedAt: new Date().toISOString(),
  }
  queue.push(item)
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
    window.dispatchEvent(new CustomEvent('chronos:offline-queue-changed', { detail: { count: queue.length } }))
  } catch (err) {
    console.warn('[OfflineQueue] Failed to persist scan to offline storage:', err)
  }
  return item
}

export async function flushOfflineQueue(
  workspaceIdOverride?: string
): Promise<{ flushed: number; remaining: number }> {
  const queue = getOfflineQueue()
  if (queue.length === 0) return { flushed: 0, remaining: 0 }

  const supabase = getSupabase()
  const remaining: QueuedOfflineScan[] = []
  let flushedCount = 0

  for (const item of queue) {
    try {
      const wsId = workspaceIdOverride || item.params.workspaceId
      if (!wsId) {
        remaining.push(item)
        continue
      }

      const { error } = await supabase.from('attendance_logs').insert({
        workspace_id: wsId,
        member_id: item.params.memberId,
        terminal_id: item.params.terminalId || null,
        direction: item.params.explicitDirection || 'in',
        scan_timestamp: item.queuedAt,
        verification_mode: item.params.verificationMode || 'biometric_fs80h',
        confidence_score: Math.round(item.params.confidenceScore || 98),
        status: 'verified',
      })

      if (error) {
        const attempts = (item.attempts ?? 0) + 1
        console.warn('[OfflineQueue] Supabase replay failed for item:', item.id, error.message)
        if (attempts >= MAX_FLUSH_ATTEMPTS) {
          // Poison item (e.g. persistently RLS-rejected) - drop it instead of
          // retrying forever every 30s and hammering the database.
          console.warn('[OfflineQueue] Dropping scan after max replay attempts:', item.id)
        } else {
          remaining.push({ ...item, attempts })
        }
      } else {
        flushedCount++
      }
    } catch {
      const attempts = (item.attempts ?? 0) + 1
      if (attempts < MAX_FLUSH_ATTEMPTS) {
        remaining.push({ ...item, attempts })
      }
    }
  }

  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining))
    window.dispatchEvent(new CustomEvent('chronos:offline-queue-changed', { detail: { count: remaining.length } }))
  } catch (err) {
    console.warn('[OfflineQueue] Failed to update queue after flush:', err)
  }

  return { flushed: flushedCount, remaining: remaining.length }
}
