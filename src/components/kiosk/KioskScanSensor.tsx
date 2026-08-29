import { Fingerprint, Clock } from 'lucide-react'

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
    <div className="flex flex-col items-center">
      {/* Live Clock Display */}
      <div className="mb-8">
        <div className="text-5xl sm:text-6xl font-mono font-black tracking-tight text-white">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        <div className="text-xs text-zinc-400 font-medium tracking-widest uppercase mt-2 flex items-center justify-center gap-1.5">
          <Clock size={13} />
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

      {/* Optical Sensor Ring */}
      <div
        onClick={() => onSimulatedScan('Dr. Amina Bello', 'STAFF-2024-001', 'Computer Engineering')}
        className={`w-36 h-36 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 relative border ${
          scanStatus === 'scanning'
            ? 'bg-[#7c007e]/30 border-[#7c007e] scale-105 shadow-2xl shadow-[#7c007e]/50'
            : 'bg-white/5 hover:bg-white/10 border-white/15 hover:border-[#7c007e]/60 shadow-xl'
        }`}
      >
        <Fingerprint
          size={64}
          className={scanStatus === 'scanning' ? 'text-[#e580e7] animate-pulse' : 'text-zinc-300'}
        />
        {scanStatus === 'scanning' && (
          <div className="absolute inset-0 rounded-full border-2 border-purple-400 animate-ping opacity-30" />
        )}
      </div>

      <p className="text-sm font-semibold text-zinc-200 mt-6 mb-1">
        Place Finger on Scanner or Tap Card
      </p>
      <p className="text-xs text-zinc-500 max-w-xs">
        Continuous biometric scan channel active. Verification will log automatically.
      </p>

      {/* Simulation Triggers for development & preview */}
      <div className="mt-8 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSimulatedScan('Dr. Amina Bello', 'STAFF-01', 'Computer Engineering')}
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
        >
          Scan: Dr. Amina
        </button>
        <button
          type="button"
          onClick={() => onSimulatedScan('Engr. Tunde Bakare', 'STAFF-02', 'Electrical Eng')}
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
        >
          Scan: Engr. Tunde
        </button>
      </div>
    </div>
  )
}
