import { useNavigate } from 'react-router-dom'
import { Laptop, AlertTriangle, ArrowLeft, Code2 } from 'lucide-react'
import { Button } from '../ui'

interface WebEnvironmentGateProps {
  devBypassActive: boolean
  onToggleDevBypass: () => void
}

export function WebEnvironmentGate({ devBypassActive, onToggleDevBypass }: WebEnvironmentGateProps) {
  const navigate = useNavigate()

  return (
    <div className="w-full max-w-lg mx-auto my-auto animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white border border-amber-200/80 rounded-3xl p-8 sm:p-10 shadow-xl shadow-amber-500/5 text-center">
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <Laptop size={32} />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wider mb-3">
          <AlertTriangle size={13} />
          <span>Windows Desktop App Required</span>
        </div>

        <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight mb-2">
          Cannot Pair in Web Browser
        </h2>

        <p className="text-xs text-zinc-600 leading-relaxed mb-6">
          To become an active physical terminal station, this software must be running inside the{' '}
          <strong className="text-zinc-900 font-bold">Chronos Windows Desktop Application (Tauri)</strong>.
          Standard web browsers cannot bind to physical USB biometric scanners (Futronic FS80H) or hold low-level hardware identity tokens.
        </p>

        {/* Instructions Box */}
        <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl p-4 mb-6 text-left space-y-2.5">
          <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block">
            How to Setup a Station:
          </span>
          <div className="flex items-start gap-2.5 text-xs text-zinc-600">
            <span className="w-5 h-5 rounded-full bg-purple-100 text-[#7c007e] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <span>Install & launch the <strong>Chronos Windows Desktop App</strong> on the station PC.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-zinc-600">
            <span className="w-5 h-5 rounded-full bg-purple-100 text-[#7c007e] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <span>Ensure the Futronic FS80H optical USB scanner is plugged in and drivers are active.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-zinc-600">
            <span className="w-5 h-5 rounded-full bg-purple-100 text-[#7c007e] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <span>Enter the 8-character OTP activation code generated from the Admin Devices page.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="outline"
            size="lg"
            className="w-full justify-center"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => navigate('/devices')}
          >
            Return to Admin Dashboard
          </Button>

          {/* Developer Preview Bypass Trigger */}
          <div className="pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onToggleDevBypass}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 hover:text-purple-700 transition-colors cursor-pointer"
            >
              <Code2 size={13} />
              <span>{devBypassActive ? 'Disable Dev Simulation' : 'Developer: Simulate Windows Tauri Shell'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
