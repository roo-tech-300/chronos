import React from 'react'
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react'

interface KioskOfflineBannerProps {
  isOnline: boolean
  queuedCount: number
  isSyncing: boolean
  lastFlushedCount: number | null
  onFlushNow: () => void
}

export const KioskOfflineBanner: React.FC<KioskOfflineBannerProps> = ({
  isOnline,
  queuedCount,
  isSyncing,
  lastFlushedCount,
  onFlushNow,
}) => {
  if (isOnline && queuedCount === 0 && !lastFlushedCount) return null

  return (
    <div className="w-full max-w-lg mx-auto mb-4 transition-all">
      {!isOnline ? (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <WifiOff size={15} className="text-amber-600 shrink-0" />
            <span>
              <strong>Station Offline</strong> — Buffering scans to local storage ({queuedCount} queued)
            </span>
          </div>
        </div>
      ) : lastFlushedCount ? (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs shadow-sm animate-pulse">
          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          <span>Synchronized {lastFlushedCount} offline scan{lastFlushedCount > 1 ? 's' : ''} to central database</span>
        </div>
      ) : queuedCount > 0 ? (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs shadow-sm">
          <span>{queuedCount} offline scan{queuedCount > 1 ? 's' : ''} ready to sync</span>
          <button
            type="button"
            onClick={onFlushNow}
            disabled={isSyncing}
            className="flex items-center gap-1 font-semibold text-purple-700 hover:text-purple-900 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}
