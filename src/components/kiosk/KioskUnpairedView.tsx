import { useNavigate } from 'react-router-dom'
import { Laptop, ShieldAlert, QrCode, ArrowRight, AlertTriangle, Code2 } from 'lucide-react'

interface KioskUnpairedViewProps {
  canBecomeTerminal: boolean
  devBypassActive: boolean
  onToggleDevBypass: () => void
}

export function KioskUnpairedView({
  canBecomeTerminal,
  devBypassActive,
  onToggleDevBypass,
}: KioskUnpairedViewProps) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-between p-6 sm:p-12 font-sans selection:bg-[#7c007e]/30">
      <div className="w-full max-w-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Laptop size={20} className="text-zinc-400" />
          </div>
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            Chronos Hardware Terminal
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/devices')}
          className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
        >
          Admin Dashboard
        </button>
      </div>

      <div className="w-full max-w-md bg-white/[0.03] border border-white/10 rounded-3xl p-8 sm:p-10 backdrop-blur-xl text-center shadow-2xl">
        {!canBecomeTerminal ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Windows Desktop App Required</h2>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              This terminal scanner is running in a standard web browser. Hardware biometric stations require the native Chronos Windows desktop application (Tauri) to interface with the Futronic FS80H scanner.
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate('/devices')}
                className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm tracking-wide border border-white/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Go to Admin Devices</span>
              </button>
              <button
                type="button"
                onClick={onToggleDevBypass}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 hover:text-purple-400 transition-colors cursor-pointer"
              >
                <Code2 size={13} />
                <span>{devBypassActive ? 'Disable Dev Simulation' : 'Developer: Simulate Windows Shell'}</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
              <ShieldAlert size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Unpaired Terminal Station</h2>
            <p className="text-xs text-zinc-400 leading-relaxed mb-8">
              This desktop machine has not been paired with a permanent Chronos hardware station token. An administrator must pair this device before it can record attendance.
            </p>

            <button
              type="button"
              onClick={() => navigate('/terminal/pair')}
              className="w-full h-12 rounded-xl bg-[#7c007e] hover:bg-[#8c008e] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#7c007e]/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <QrCode size={18} />
              <span>Pair This Machine</span>
              <ArrowRight size={16} />
            </button>
          </>
        )}
      </div>

      <div className="text-xs text-zinc-600">Chronos Autonomous Terminal Engine</div>
    </div>
  )
}
