import { Fingerprint, Clock, Sparkles } from 'lucide-react'

interface KioskScanSensorProps {
  currentTime: Date
  scanStatus: 'idle' | 'scanning' | 'success'
  onSimulatedScan: (name: string, id: string, dept: string) => void
}

export function KioskScanSensor({
  currentTime,
  scanStatus,
  onSimulatedScan,
}: KioskScanSensorProps) {
  return (
    <div className="flex flex-col items-center select-none">
      {/* Live High-Contrast Clock Display */}
      <div className="mb-8 text-center">
        <div className="text-6xl sm:text-7xl font-mono font-extrabold tracking-tight text-zinc-900 drop-shadow-2xs">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        <div className="text-xs text-zinc-500 font-semibold tracking-wider uppercase mt-2.5 flex items-center justify-center gap-1.5">
          <Clock size={13} className="text-[#7c007e]" />
          <span>
            {currentTime.toLocaleDateString([], {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Optical Sensor Ring Card */}
      <div className="bg-white border border-zinc-200/90 rounded-3xl p-8 sm:p-10 shadow-lg shadow-zinc-900/5 flex flex-col items-center max-w-md w-full">
        <button
          type="button"
          onClick={() => onSimulatedScan('Dr. Amina Bello', 'STAFF-2024-001', 'Computer Engineering')}
          className={`w-36 h-36 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 relative border ${
            scanStatus === 'scanning'
              ? 'bg-purple-50 border-[#7c007e] scale-105 shadow-xl shadow-[#7c007e]/20 ring-4 ring-[#7c007e]/10'
              : 'bg-zinc-50 hover:bg-purple-50/50 border-zinc-200 hover:border-purple-300 shadow-inner'
          }`}
          title="Click to trigger fingerprint scan"
        >
          <Fingerprint
            size={68}
            className={`transition-colors ${
              scanStatus === 'scanning' ? 'text-[#7c007e] animate-pulse' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          />
          {scanStatus === 'scanning' && (
            <div className="absolute inset-0 rounded-full border-2 border-[#7c007e] animate-ping opacity-40" />
          )}
        </button>

        <h3 className="text-base font-extrabold text-zinc-900 mt-6 mb-1 tracking-tight">
          {scanStatus === 'scanning' ? 'Scanning Optical Sensor...' : 'Place Finger on Scanner Glass'}
        </h3>
        <p className="text-xs text-zinc-500 text-center max-w-xs leading-relaxed">
          Futronic FS80H hardware channel active. Verification and attendance logging are autonomous.
        </p>

        {/* Developer simulation pills */}
        <div className="mt-6 pt-5 border-t border-zinc-100 w-full flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
            <Sparkles size={11} className="text-[#7c007e]" />
            Quick Test Simulation
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onSimulatedScan('Dr. Amina Bello', 'CHR-001', 'Computer Engineering')}
              className="px-3 py-1.5 rounded-xl bg-zinc-50 hover:bg-purple-50 text-xs font-semibold text-zinc-700 hover:text-[#7c007e] border border-zinc-200/80 transition-all cursor-pointer shadow-2xs"
            >
              Scan: Dr. Amina
            </button>
            <button
              type="button"
              onClick={() => onSimulatedScan('Engr. Tunde Bakare', 'CHR-002', 'Electrical Eng')}
              className="px-3 py-1.5 rounded-xl bg-zinc-50 hover:bg-purple-50 text-xs font-semibold text-zinc-700 hover:text-[#7c007e] border border-zinc-200/80 transition-all cursor-pointer shadow-2xs"
            >
              Scan: Engr. Tunde
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
