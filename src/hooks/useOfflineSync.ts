import { useState, useEffect, useCallback } from 'react'
import {
  getOfflineQueueCount,
  flushOfflineQueue,
} from '../services/terminalOfflineQueue'

export function useOfflineSync(workspaceId?: string) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [queuedCount, setQueuedCount] = useState(getOfflineQueueCount())
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastFlushedCount, setLastFlushedCount] = useState<number | null>(null)

  const handleFlush = useCallback(async () => {
    if (isSyncing || getOfflineQueueCount() === 0) return
    setIsSyncing(true)
    try {
      const res = await flushOfflineQueue(workspaceId)
      setQueuedCount(res.remaining)
      if (res.flushed > 0) {
        setLastFlushedCount(res.flushed)
        setTimeout(() => setLastFlushedCount(null), 3000)
      }
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing, workspaceId])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      handleFlush()
    }
    const handleOffline = () => setIsOnline(false)

    const handleQueueChange = (e: Event) => {
      const custom = e as CustomEvent<{ count: number }>
      setQueuedCount(custom.detail?.count ?? getOfflineQueueCount())
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('chronos:offline-queue-changed', handleQueueChange)

    // Periodic check every 30s
    const timer = setInterval(() => {
      if (navigator.onLine && getOfflineQueueCount() > 0) {
        handleFlush()
      }
    }, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('chronos:offline-queue-changed', handleQueueChange)
      clearInterval(timer)
    }
  }, [handleFlush])

  return {
    isOnline,
    queuedCount,
    isSyncing,
    lastFlushedCount,
    flushNow: handleFlush,
  }
}
