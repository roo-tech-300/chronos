import { useState, useEffect, useRef } from 'react'
import { RefreshCw, CheckCircle2, AlertCircle, X, HardDrive, ArrowDownToLine, FolderOpen } from 'lucide-react'
import { syncBiometricTemplates, getLocalBridgeTemplates, type BiometricSyncResult } from '../../services/biometricSyncService'

interface BiometricSyncModalProps {
  isOpen: boolean
  organizationId?: string
  onClose: () => void
}

export function BiometricSyncModal({ isOpen, organizationId, onClose }: BiometricSyncModalProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [progressText, setProgressText] = useState('')
  const [localFileCount, setLocalFileCount] = useState<number | null>(null)
  const [dataDirectory, setDataDirectory] = useState<string>('')
  const [bridgeOnline, setBridgeOnline] = useState(true)
  const [lastResult, setLastResult] = useState<BiometricSyncResult | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true
    if (isOpen) {
      getLocalBridgeTemplates().then((res) => {
        if (isMounted) {
          setBridgeOnline(res.online)
          setLocalFileCount(res.files.length)
          if (res.dataDir) setDataDirectory(res.dataDir)
        }
      })
    }
    return () => {
      isMounted = false
    }
  }, [isOpen])

  // Escape key & Click-outside listener (Rules #3)
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSyncing) onClose()
    }
    const handleMouseDown = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) && !isSyncing) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [isOpen, isSyncing, onClose])

  const handleStartSync = async () => {
    setIsSyncing(true)
    setProgressText('Connecting to Supabase Storage & local bridge...')
    setLastResult(null)

    try {
      const res = await syncBiometricTemplates(organizationId, (msg) => {
        setProgressText(msg)
      })
      setLastResult(res)
      const updatedBridge = await getLocalBridgeTemplates()
      setBridgeOnline(updatedBridge.online)
      setLocalFileCount(updatedBridge.files.length)
      if (updatedBridge.dataDir) setDataDirectory(updatedBridge.dataDir)
    } catch (err) {
      setLastResult({
        success: false,
        totalCloudTemplates: 0,
        alreadySyncedCount: 0,
        newlySyncedCount: 0,
        failedCount: 0,
        message: err instanceof Error ? err.message : 'Sync encountered an unexpected error.',
      })
    } finally {
      setIsSyncing(false)
      setProgressText('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="bg-white border border-zinc-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-left"
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#7c007e] border border-purple-100 flex items-center justify-center">
              <ArrowDownToLine size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Sync Biometric Templates</h2>
              <p className="text-xs text-zinc-500">Download missing minutiae (.xyt) from cloud database to local storage</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSyncing}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="my-5 space-y-4">
          <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
              <FolderOpen size={13} className="text-[#7c007e]" />
              <span className="font-semibold">Local Storage Directory</span>
            </div>
            <p className="text-xs font-mono font-medium text-zinc-800 break-all select-all">
              {dataDirectory ? `${dataDirectory}\\minut` : '%LOCALAPPDATA%\\Chronos\\data\\minut'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
                <HardDrive size={13} className="text-[#7c007e]" />
                <span className="font-semibold">Minutiae Files</span>
              </div>
              <p className="text-lg font-bold text-zinc-900">
                {localFileCount !== null ? `${localFileCount} files` : 'Checking...'}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100">
              <div className="flex items-center gap-1.5 text-xs text-purple-900 mb-1">
                <span className={`w-2 h-2 rounded-full ${bridgeOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className="font-semibold">Node Bridge</span>
              </div>
              <p className={`text-sm font-bold ${bridgeOnline ? 'text-emerald-700' : 'text-rose-700'}`}>
                {bridgeOnline ? '127.0.0.1:8080' : 'Bridge Offline'}
              </p>
            </div>
          </div>

          {progressText && (
            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200/80 flex items-center gap-2.5 text-xs text-[#7c007e] font-medium">
              <RefreshCw size={14} className="animate-spin shrink-0" />
              <span className="truncate">{progressText}</span>
            </div>
          )}

          {lastResult && (
            <div
              className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs ${
                lastResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {lastResult.success ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-bold">{lastResult.message}</p>
                {lastResult.success && lastResult.newlySyncedCount > 0 && (
                  <p className="text-[11px] text-emerald-700">
                    Downloaded {lastResult.newlySyncedCount} template(s). Up to date: {lastResult.alreadySyncedCount}.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleStartSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7c007e] hover:bg-[#68006a] text-xs font-bold text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Minutiae Now'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
