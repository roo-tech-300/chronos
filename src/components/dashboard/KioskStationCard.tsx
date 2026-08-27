import { useNavigate } from 'react-router-dom'
import { TrendingUp, Laptop, ArrowRight } from 'lucide-react'
import { useWorkspace } from '../../context/useWorkspace'
import { useTerminalAuth } from '../../hooks/useTerminalAuth'

export function KioskStationCard() {
  const navigate = useNavigate()
  const { currentWorkspace, accentColor } = useWorkspace()
  const { terminal, isPaired } = useTerminalAuth()

  // Only display this card if this physical device is actively paired
  // as a terminal in the CURRENT active organization/workspace
  const isTerminalInCurrentWorkspace = Boolean(
    isPaired &&
    terminal &&
    terminal.status === 'online' &&
    currentWorkspace &&
    (terminal.workspaceId === currentWorkspace.id ||
      terminal.workspaceId === currentWorkspace.slug ||
      terminal.workspaceId === 'default')
  )

  if (!isTerminalInCurrentWorkspace) {
    return null
  }

  const handleOpenKiosk = () => {
    navigate('/scan')
  }

  return (
    <div className="dash-kiosk" id="dashboard-active-kiosk-card">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
          style={{ backgroundColor: accentColor }}
        >
          <Laptop size={14} />
        </div>
        <span
          className="text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
        >
          Enrolled Terminal Station
        </span>
      </div>
      <h3>{terminal?.name || 'Attendance Kiosk'}</h3>
      <p>
        This physical device is enrolled and active in <span className="font-semibold text-zinc-800">{currentWorkspace?.name || 'this organization'}</span>. Location:{' '}
        <span className="text-zinc-900 font-semibold">{terminal?.location || 'Main Gate'}</span> (
        {terminal?.mode === 'exit' ? 'Exit Gate' : 'Entry Gate'}).
      </p>

      <div className="dash-kiosk-bottom mt-4 relative z-10">
        <div>
          <div className="dash-kiosk-status-label">Station State</div>
          <div className="dash-kiosk-status">
            <span className="dash-kiosk-dot animate-pulse" style={{ backgroundColor: '#10b981' }} />
            <span className="text-emerald-700 font-medium">Active & Ready</span>
          </div>
        </div>
        <button
          type="button"
          id="btn-open-kiosk-screen"
          onClick={handleOpenKiosk}
          style={{ backgroundColor: accentColor }}
          className="inline-flex items-center justify-center font-semibold rounded-xl transition-all cursor-pointer hover:opacity-90 text-white shadow-sm px-5 py-2.5 text-sm gap-2 active:scale-95"
        >
          Open Kiosk Screen
          <ArrowRight size={16} />
        </button>
      </div>
      <TrendingUp size={240} className="dash-kiosk-icon pointer-events-none select-none" />
    </div>
  )
}
