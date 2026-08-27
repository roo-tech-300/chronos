import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Fingerprint, Laptop, QrCode, ShieldAlert, CheckCircle2, Wifi, Clock, ArrowRight, UserCheck } from 'lucide-react'
import { useTerminalAuth } from './hooks/useTerminalAuth'

export default function KioskScanPage() {
  const navigate = useNavigate()
  const { terminal, isPaired, isLoading, unpairDevice } = useTerminalAuth()

  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success'>('idle')
  const [lastScannedStaff, setLastScannedStaff] = useState<{
    name: string
    id: string
    time: string
    dept: string
    type: 'Check-In' | 'Check-Out'
  } | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [unpairModalOpen, setUnpairModalOpen] = useState(false)

  // Live Digital Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto reset kiosk state 3.0 seconds after successful verification (Kiosk Rule #8)
  useEffect(() => {
    if (scanStatus === 'success') {
      const resetTimer = setTimeout(() => {
        setScanStatus('idle')
        setLastScannedStaff(null)
      }, 3000)
      return () => clearTimeout(resetTimer)
    }
  }, [scanStatus])

  // Simulated scan trigger for testing the hardware station
  const handleSimulatedScan = (staffName: string, staffId: string, dept: string) => {
    if (scanStatus === 'scanning') return
    setScanStatus('scanning')

    setTimeout(() => {
      setLastScannedStaff({
        name: staffName,
        id: staffId,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        dept,
        type: terminal?.mode === 'exit' ? 'Check-Out' : 'Check-In',
      })
      setScanStatus('success')
    }, 800)
  }

  // If loading local credentials
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#7c007e] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 font-medium tracking-wide">Validating Terminal Credentials...</p>
        </div>
      </div>
    )
  }

  // IF UNPAIRED MACHINE: Display hardware activation gate
  if (!isPaired || !terminal) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-between p-6 sm:p-12 font-sans selection:bg-[#7c007e]/30">
        <div className="w-full max-w-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Laptop size={20} className="text-zinc-400" />
            </div>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Chronos Hardware Terminal</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/devices')}
            className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            Admin Dashboard
          </button>
        </div>

        <div className="w-full max-w-md bg-white/[0.03] border border-white/10 rounded-3xl p-8 sm:p-10 backdrop-blur-xl text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Unpaired Terminal Station</h2>
          <p className="text-xs text-zinc-400 leading-relaxed mb-8">
            This machine has not been paired with a permanent Chronos hardware station token. An administrator must pair this device before it can record attendance.
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
        </div>

        <div className="text-xs text-zinc-600">Chronos Autonomous Terminal Engine</div>
      </div>
    )
  }

  // PAIRED KIOSK INTERFACE
  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Top Telemetry Header */}
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

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Wifi size={13} />
            <span>Live Station Online</span>
          </div>

          <button
            type="button"
            onClick={() => setUnpairModalOpen(true)}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
            title="Terminal Options"
          >
            <Laptop size={18} />
          </button>
        </div>
      </header>

      {/* Centerpiece Scanner / Confirmation Feed */}
      <main className="w-full max-w-lg mx-auto text-center my-auto">
        {scanStatus === 'success' && lastScannedStaff ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-8 backdrop-blur-xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={44} />
            </div>
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              {lastScannedStaff.type} Confirmed
            </span>
            <h2 className="text-2xl font-black text-white">{lastScannedStaff.name}</h2>
            <p className="text-xs font-mono text-zinc-400 mt-1">ID: {lastScannedStaff.id} • {lastScannedStaff.dept}</p>
            <p className="text-xs text-emerald-400 font-mono mt-3 font-semibold">
              Verified at {lastScannedStaff.time}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Live Clock Display */}
            <div className="mb-8">
              <div className="text-5xl sm:text-6xl font-mono font-black tracking-tight text-white">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-xs text-zinc-400 font-medium tracking-widest uppercase mt-2 flex items-center justify-center gap-1.5">
                <Clock size={13} />
                <span>
                  {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Scan Optical Sensor Circle */}
            <div
              onClick={() => handleSimulatedScan('Dr. Amina Bello', 'STAFF-2024-001', 'Computer Engineering')}
              className={`w-36 h-36 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 relative border ${
                scanStatus === 'scanning'
                  ? 'bg-[#7c007e]/30 border-[#7c007e] scale-105 shadow-2xl shadow-[#7c007e]/50'
                  : 'bg-white/5 hover:bg-white/10 border-white/15 hover:border-[#7c007e]/60 shadow-xl'
              }`}
            >
              <Fingerprint size={64} className={scanStatus === 'scanning' ? 'text-[#e580e7] animate-pulse' : 'text-zinc-300'} />
              {scanStatus === 'scanning' && (
                <div className="absolute inset-0 rounded-full border-2 border-purple-400 animate-ping opacity-30" />
              )}
            </div>

            <p className="text-sm font-semibold text-zinc-200 mt-6 mb-1">
              Place Finger on Scanner or Tap Card
            </p>
            <p className="text-xs text-zinc-500 max-w-xs">
              Continuous scan channel active. Verification will log automatically.
            </p>

            {/* Demo Simulation Bar */}
            <div className="mt-8 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSimulatedScan('Dr. Amina Bello', 'STAFF-01', 'Computer Engineering')}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
              >
                Scan: Dr. Amina
              </button>
              <button
                type="button"
                onClick={() => handleSimulatedScan('Engr. Tunde Bakare', 'STAFF-02', 'Electrical Eng')}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
              >
                Scan: Engr. Tunde
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Details */}
      <footer className="w-full flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <UserCheck size={15} className="text-zinc-400" />
          <span>Terminal ID: <span className="font-mono text-zinc-300">{terminal.id}</span></span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/devices')}
          className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
        >
          Exit Kiosk Mode
        </button>
      </footer>

      {/* Unpair / Reset Modal */}
      {unpairModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#141418] border border-white/15 rounded-2xl p-6 max-w-sm w-full text-center">
            <h3 className="text-base font-bold text-white mb-2">Unpair Hardware Station?</h3>
            <p className="text-xs text-zinc-400 mb-6">
              This will wipe the permanent token from this laptop. The machine will need to be re-paired with a new code.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUnpairModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  unpairDevice()
                  setUnpairModalOpen(false)
                }}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white transition-colors"
              >
                Unpair Device
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
