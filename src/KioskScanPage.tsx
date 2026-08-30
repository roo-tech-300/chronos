import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, LogOut } from 'lucide-react'
import { useTerminalAuth } from './hooks/useTerminalAuth'
import { useTauriEnvironment } from './hooks/useTauriEnvironment'
import { useKioskScan } from './hooks/useKioskScan'
import { KioskHeader } from './components/kiosk/KioskHeader'
import { KioskScanSensor } from './components/kiosk/KioskScanSensor'
import { KioskSuccessCard } from './components/kiosk/KioskSuccessCard'
import { KioskUnpairModal } from './components/kiosk/KioskUnpairModal'
import type { TerminalDevice } from './types/terminal'

export default function KioskScanPage() {
  const navigate = useNavigate()
  const { terminal, unpairDevice } = useTerminalAuth()
  const { isWindowsApp, devBypassActive } = useTauriEnvironment()

  // Provide guaranteed fallback terminal object so Kiosk Mode is immediately operational
  const activeTerminal: TerminalDevice = terminal || {
    id: 'kiosk_main_station',
    name: 'Main Attendance Kiosk',
    location: 'Main Reception',
    mode: 'bidirectional',
    status: 'online',
    createdAt: new Date().toISOString(),
  }

  const {
    scanStatus,
    lastScannedStaff,
    errorMessage,
    hardwareDetected,
    triggerScan,
  } = useKioskScan(activeTerminal)

  const [currentTime, setCurrentTime] = useState(new Date())
  const [unpairModalOpen, setUnpairModalOpen] = useState(false)

  // Live Digital Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 flex flex-col justify-between p-6 sm:p-10 select-none font-sans">
      <KioskHeader
        terminal={activeTerminal}
        isWindowsApp={isWindowsApp}
        devBypassActive={devBypassActive}
        onOpenOptions={() => setUnpairModalOpen(true)}
      />

      {/* Centerpiece Scanner / Confirmation Feed */}
      <main className="w-full max-w-lg mx-auto text-center my-auto py-6">
        {scanStatus === 'success' && lastScannedStaff ? (
          <KioskSuccessCard staff={lastScannedStaff} />
        ) : scanStatus === 'error' ? (
          <KioskSuccessCard
            staff={{
              name: 'Scan Unsuccessful',
              id: 'ERR',
              time: currentTime.toLocaleTimeString(),
              dept: '',
              type: 'Check-In',
            }}
            isError
            errorMessage={errorMessage || 'Could not verify fingerprint.'}
          />
        ) : (
          <KioskScanSensor
            currentTime={currentTime}
            scanStatus={scanStatus}
            hardwareOnline={hardwareDetected}
            onTriggerScan={triggerScan}
          />
        )}
      </main>

      {/* Footer Details */}
      <footer className="w-full max-w-5xl mx-auto flex items-center justify-between text-xs text-zinc-500 pt-4 border-t border-zinc-200/80">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#7c007e]" />
          <span>
            Station ID: <span className="font-mono font-bold text-zinc-700">{activeTerminal.id}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/devices')}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
        >
          <LogOut size={13} />
          <span>Exit Kiosk Mode</span>
        </button>
      </footer>

      <KioskUnpairModal
        isOpen={unpairModalOpen}
        onClose={() => setUnpairModalOpen(false)}
        onUnpair={unpairDevice}
      />
    </div>
  )
}
