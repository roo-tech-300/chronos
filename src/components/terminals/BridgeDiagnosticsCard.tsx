import { useState } from 'react'
import { RefreshCw, CheckCircle2, AlertCircle, Settings2 } from 'lucide-react'
import { useFutronicBridge } from '../../hooks/useFutronicBridge'
import { Button } from '../ui'

export function BridgeDiagnosticsCard() {
  const {
    isBridgeOnline,
    scannerStatus,
    isChecking,
    currentPort,
    checkStatus,
    updatePort,
  } = useFutronicBridge()

  const [isEditingPort, setIsEditingPort] = useState(false)
  const [portInput, setPortInput] = useState(currentPort.toString())

  const handlePortSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const p = parseInt(portInput, 10)
    if (!isNaN(p) && p > 0 && p < 65536) {
      updatePort(p)
      setIsEditingPort(false)
    }
  }

  // Determine status message and theme
  let statusText: string
  let statusType: 'ready' | 'no-hardware' | 'no-server'

  if (!isBridgeOnline) {
    statusText = 'The server is not connected'
    statusType = 'no-server'
  } else if (!scannerStatus.isConnected) {
    statusText = "Couldn't find hardware"
    statusType = 'no-hardware'
  } else {
    statusText = 'This terminal is ready to scan'
    statusType = 'ready'
  }

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border border-zinc-200/80 rounded-xl shadow-xs">
        {/* Left: Status indicator and one-line message */}
        <div className="flex items-center gap-2.5 min-w-0">
          {statusType === 'ready' && (
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 shrink-0">
              <CheckCircle2 size={15} />
            </div>
          )}
          {statusType === 'no-hardware' && (
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-600 shrink-0">
              <AlertCircle size={15} />
            </div>
          )}
          {statusType === 'no-server' && (
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 text-zinc-500 shrink-0">
              <AlertCircle size={15} />
            </div>
          )}

          <div className="flex items-center gap-2 truncate">
            <span
              className={`text-sm font-semibold truncate ${
                statusType === 'ready'
                  ? 'text-zinc-900'
                  : statusType === 'no-hardware'
                  ? 'text-amber-800'
                  : 'text-zinc-700'
              }`}
            >
              {statusText}
            </span>

            <span className="hidden sm:inline-block text-xs text-zinc-400 font-mono">
              (127.0.0.1:{currentPort})
            </span>
          </div>
        </div>

        {/* Right: Manual Check button and subtle port config */}
        <div className="flex items-center gap-2">
          {isEditingPort ? (
            <form onSubmit={handlePortSubmit} className="flex items-center gap-1.5">
              <input
                type="number"
                value={portInput}
                onChange={(e) => setPortInput(e.target.value)}
                className="w-20 px-2 py-1 text-xs border border-zinc-300 rounded-lg bg-white font-mono"
                placeholder="8080"
                autoFocus
              />
              <Button type="submit" size="sm" variant="primary">
                Save
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditingPort(false)}>
                Cancel
              </Button>
            </form>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => checkStatus()}
                isLoading={isChecking}
                leftIcon={<RefreshCw size={13} className={isChecking ? 'animate-spin' : ''} />}
              >
                Check
              </Button>
              <button
                type="button"
                onClick={() => setIsEditingPort(true)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                title="Configure Bridge Port"
              >
                <Settings2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
