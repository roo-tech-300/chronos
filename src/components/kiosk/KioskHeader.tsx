import { useState } from 'react'
import { Fingerprint, Laptop, Wifi, Cpu, ArrowDownToLine, RefreshCw, CheckCircle2 } from 'lucide-react'
import type { TerminalDevice } from '../../types/terminal'
import { BiometricSyncModal } from './BiometricSyncModal'
import { useKioskAutoSync } from '../../hooks/useKioskAutoSync'

interface KioskHeaderProps {
  terminal: TerminalDevice
  isWindowsApp: boolean
  devBypassActive: boolean
  onOpenOptions: () => void
}

export function KioskHeader({
  terminal,
  isWindowsApp,
  devBypassActive,
  onOpenOptions,
}: KioskHeaderProps) {
  const [syncModalOpen, setSyncModalOpen] = useState(false)
  const { status: autoSyncStatus, differential } = useKioskAutoSync(terminal.workspaceId)

  return (
    <>
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#7c007e] flex items-center justify-center text-white shadow-sm">
            <Fingerprint size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-zinc-900 tracking-tight">{terminal.name}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-[#7c007e] border border-purple-200">
                {terminal.mode} mode
              </span>
            </div>
            <p className="text-xs text-zinc-500">{terminal.location}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Smart Template Sync Indicator & Button */}
          <button
            type="button"
            onClick={() => setSyncModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50/50 border border-zinc-200 hover:border-purple-200 text-xs font-semibold text-zinc-700 hover:text-[#7c007e] shadow-2xs transition-colors cursor-pointer"
            title="Database is source of truth. Click to inspect or force-sync."
          >
            {autoSyncStatus === 'checking' || autoSyncStatus === 'syncing' ? (
              <RefreshCw size={13} className="animate-spin text-[#7c007e]" />
            ) : autoSyncStatus === 'synced' ? (
              <CheckCircle2 size={13} className="text-emerald-600" />
            ) : (
              <ArrowDownToLine size={13} className="text-[#7c007e]" />
            )}
            <span className="hidden sm:inline">
              {autoSyncStatus === 'checking'
                ? 'Checking...'
                : autoSyncStatus === 'syncing'
                ? 'Syncing...'
                : differential && differential.cloudTotal > 0
                ? `Sync (${differential.localTotal}/${differential.cloudTotal})`
                : 'Sync Templates'}
            </span>
          </button>

          {/* Runtime Environment Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-zinc-200 text-xs font-semibold text-zinc-700 shadow-2xs">
            <Cpu size={13} className="text-[#7c007e]" />
            <span>{isWindowsApp ? 'Windows Tauri' : devBypassActive ? 'Dev Simulation' : 'Web Preview'}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs font-bold text-emerald-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Wifi size={13} />
            <span>Active</span>
          </div>

          <button
            type="button"
            onClick={onOpenOptions}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 border border-zinc-200 bg-white transition-colors cursor-pointer shadow-2xs"
            title="Terminal Options"
          >
            <Laptop size={16} />
          </button>
        </div>
      </header>

      <BiometricSyncModal
        isOpen={syncModalOpen}
        organizationId={terminal.workspaceId}
        onClose={() => setSyncModalOpen(false)}
      />
    </>
  )
}
