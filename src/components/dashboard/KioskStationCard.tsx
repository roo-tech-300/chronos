import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { Button } from '../ui'
import { useWorkspace } from '../../context/useWorkspace'

export function KioskStationCard() {
  const { stats, accentColor } = useWorkspace()

  return (
    <div className="dash-kiosk">
      <h3>Launch Attendance Kiosk</h3>
      <p>Turn this computer or hardware terminal into a physical check-in station.</p>
      <div className="dash-kiosk-bottom">
        <div>
          <div className="dash-kiosk-status-label">System Status</div>
          <div className="dash-kiosk-status">
            <span className="dash-kiosk-dot" style={{ backgroundColor: accentColor }} />
            {stats.onlineDevices > 0 ? `${stats.onlineDevices} Nodes Ready` : 'Terminal Standby'}
          </div>
        </div>
        <Link to="/scan">
          <Button variant="primary">
            Open Kiosk Screen
          </Button>
        </Link>
      </div>
      <TrendingUp size={256} className="dash-kiosk-icon" />
    </div>
  )
}
