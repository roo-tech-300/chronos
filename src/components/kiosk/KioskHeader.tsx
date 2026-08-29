import { Fingerprint, Laptop, Wifi, Cpu } from 'lucide-react'
import type { TerminalDevice } from '../../types/terminal'

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
  return (
    <header className="w-full flex items-center justify-between">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7c007e] to-[#470048] flex items-center justify-center border border-white/15 shadow-md">
          <Fingerprint size={24} className="text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white tracking-tight">{terminal.name}</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#7c007e]/30 text-purple-300 border border-[#7c007e]/40">
              {terminal.mode} mode
            </span>
          </div>
          <p className="text-xs text-zinc-400">{terminal.location}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Runtime Environment Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300">
          <Cpu size={13} className="text-purple-400" />
          <span>{isWindowsApp ? 'Windows Tauri Shell' : devBypassActive ? 'Dev Simulation' : 'Web Preview'}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Wifi size={13} />
          <span>Live Station</span>
        </div>

        <button
          type="button"
          onClick={onOpenOptions}
          className="p-2 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer"
          title="Terminal Options"
        >
          <Laptop size={18} />
        </button>
      </div>
    </header>
  )
}
