import { useNavigate } from 'react-router-dom'
import { Laptop, ShieldAlert, QrCode, ArrowRight, AlertTriangle, Code2, ArrowLeft } from 'lucide-react'
import { Button } from '../ui'

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
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 flex flex-col items-center justify-between p-6 sm:p-12 font-sans select-none">
      {/* Top Bar */}
      <div className="w-full max-w-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#7c007e] shadow-xs">
            <Laptop size={20} />
          </div>
          <div>
            <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider block">
              Chronos Hardware Terminal
            </span>
            <span className="text-[11px] text-zinc-400">Autonomous Scanning Station</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/devices')}
          leftIcon={<ArrowLeft size={14} />}
        >
          Admin Dashboard
        </Button>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-8 sm:p-10 shadow-lg shadow-zinc-900/5 text-center">
        {!canBecomeTerminal ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-5 shadow-xs">
              <AlertTriangle size={32} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wider mb-3">
              <AlertTriangle size={13} />
              <span>Windows App Required</span>
            </div>
            <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight mb-2">
              Desktop Shell Required
            </h2>
            <p className="text-xs text-zinc-600 leading-relaxed mb-6">
              This terminal scanner is running in a web browser. Hardware biometric scanning stations require the native Chronos Windows desktop application (Tauri) to interface with the Futronic FS80H scanner.
            </p>
            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center"
                onClick={() => navigate('/devices')}
              >
                Go to Admin Devices
              </Button>
              <div className="pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={onToggleDevBypass}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 hover:text-purple-700 transition-colors cursor-pointer"
                >
                  <Code2 size={13} />
                  <span>{devBypassActive ? 'Disable Dev Simulation' : 'Developer: Simulate Windows Shell'}</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#7c007e] border border-purple-100 flex items-center justify-center mx-auto mb-5 shadow-xs">
              <ShieldAlert size={32} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#7c007e] border border-purple-100 text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldAlert size={13} />
              <span>Device Not Paired</span>
            </div>
            <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight mb-2">
              Unpaired Terminal Station
            </h2>
            <p className="text-xs text-zinc-600 leading-relaxed mb-8">
              This desktop machine has not been paired with a permanent Chronos hardware station token. An administrator must pair this device before it can record attendance.
            </p>

            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center"
              leftIcon={<QrCode size={18} />}
              rightIcon={<ArrowRight size={16} />}
              onClick={() => navigate('/terminal/pair')}
            >
              Pair This Machine
            </Button>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-xs text-zinc-400 font-medium">
        Chronos Autonomous Terminal Engine • Secure Hardware Verification
      </div>
    </div>
  )
}
