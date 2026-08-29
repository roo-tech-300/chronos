import { useState } from 'react'
import { Cpu, RefreshCw, CheckCircle2, AlertCircle, Fingerprint, Zap, Settings2, Terminal, ChevronDown, ChevronUp } from 'lucide-react'
import { useFutronicBridge } from '../../hooks/useFutronicBridge'
import { Button } from '../ui'

export function BridgeDiagnosticsCard() {
  const {
    isBridgeOnline,
    bridgeVersion,
    scannerStatus,
    isChecking,
    isCapturing,
    lastCapture,
    currentPort,
    logs,
    checkStatus,
    triggerCapture,
    updatePort,
  } = useFutronicBridge()

  const [isEditingPort, setIsEditingPort] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [portInput, setPortInput] = useState(currentPort.toString())

  const handlePortSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const p = parseInt(portInput, 10)
    if (!isNaN(p) && p > 0 && p < 65536) {
      updatePort(p)
      setIsEditingPort(false)
    }
  }

  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#7c007e] border border-purple-100 flex items-center justify-center">
            <Cpu size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900">Local Futronic Scanner Bridge</h3>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isBridgeOnline
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isBridgeOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                {isBridgeOnline ? 'Bridge Online' : 'Bridge Offline'}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Host: <span className="font-mono text-zinc-700">127.0.0.1:{currentPort}</span> {bridgeVersion && `(${bridgeVersion})`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLogs(!showLogs)}
            leftIcon={<Terminal size={13} />}
          >
            Logs {showLogs ? <ChevronUp size={13} className="ml-1" /> : <ChevronDown size={13} className="ml-1" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => checkStatus()}
            isLoading={isChecking}
            leftIcon={<RefreshCw size={13} className={isChecking ? 'animate-spin' : ''} />}
          >
            Check Health
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditingPort(!isEditingPort)}
            leftIcon={<Settings2 size={13} />}
          >
            Port
          </Button>
        </div>
      </div>

      {/* Port Edit Input */}
      {isEditingPort && (
        <form onSubmit={handlePortSubmit} className="py-3 px-4 bg-zinc-50 rounded-xl my-3 flex items-center gap-2">
          <label className="text-xs text-zinc-600 font-medium">Bridge Port:</label>
          <input
            type="number"
            value={portInput}
            onChange={(e) => setPortInput(e.target.value)}
            className="w-24 px-2 py-1 text-xs border border-zinc-300 rounded-lg bg-white font-mono"
            placeholder="8080"
          />
          <Button type="submit" size="sm" variant="primary">Save</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditingPort(false)}>Cancel</Button>
        </form>
      )}

      {/* Live Terminal Diagnostic Logs */}
      {showLogs && (
        <div className="my-3 p-3 bg-zinc-950 text-zinc-200 rounded-xl font-mono text-xs border border-zinc-800 shadow-inner">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Diagnostic Log Feed
            </span>
            <span>Console + Terminal Sync</span>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-[11px]">
            {logs.length === 0 ? (
              <p className="text-zinc-500 italic">No logs yet. Click &quot;Check Health&quot; to probe.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2">
                  <span className="text-zinc-500 select-none">[{log.time}]</span>
                  <span
                    className={
                      log.type === 'success'
                        ? 'text-emerald-400 font-semibold'
                        : log.type === 'warn'
                        ? 'text-amber-400 font-semibold'
                        : 'text-zinc-300'
                    }
                  >
                    {log.text}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {/* Hardware Status */}
        <div className="bg-zinc-50/70 border border-zinc-200/70 rounded-xl p-3.5 flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            scannerStatus.isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-600'
          }`}>
            {scannerStatus.isConnected ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">USB Optical Scanner</span>
            <span className="text-xs font-bold text-zinc-900 truncate block">
              {scannerStatus.deviceModel}
            </span>
            <span className="text-[11px] text-zinc-500 block">
              Status: {scannerStatus.isConnected ? 'USB Connected & Driver Ready' : scannerStatus.error || 'No scanner detected'}
            </span>
          </div>
        </div>

        {/* Live Capture Test */}
        <div className="bg-zinc-50/70 border border-zinc-200/70 rounded-xl p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-[#7c007e] flex items-center justify-center shrink-0">
              <Fingerprint size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Biometric Capture</span>
              <span className="text-xs font-semibold text-zinc-700 block truncate">
                {lastCapture ? `Hash: ${lastCapture.templateHash.slice(0, 12)}...` : 'Ready to capture'}
              </span>
              {lastCapture && (
                <span className="text-[10px] text-emerald-600 font-mono font-medium block">
                  Quality Score: {lastCapture.qualityScore}% (SHA-256)
                </span>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerCapture()}
            isLoading={isCapturing}
            disabled={!isBridgeOnline}
            leftIcon={<Zap size={13} />}
          >
            Trigger Test
          </Button>
        </div>
      </div>
    </div>
  )
}
