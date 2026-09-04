import { useWorkspace } from './context/useWorkspace'
import { useRealtimeAttendance } from './hooks/useRealtimeAttendance'
import AppNavbar from './components/layout/AppNavbar'
import { DashboardMetrics } from './components/dashboard/DashboardMetrics'
import { AttendanceChartCard } from './components/dashboard/AttendanceChartCard'
import { KioskStationCard } from './components/dashboard/KioskStationCard'
import { LiveHeadcard } from './components/dashboard/LiveHeadcard'
import './styles/dashboard-layout.css'
import './styles/dashboard-widgets.css'

export default function DashboardPage() {
  const { currentWorkspace, accentColor } = useWorkspace()
  const brandTitle = currentWorkspace?.name || 'Natale'

  // Subscribes to live Supabase telemetry websocket events for instant UI synchronization
  useRealtimeAttendance(currentWorkspace?.id)

  return (
    <div
      className="dash-page"
      style={
        {
          '--dash-primary': accentColor,
          '--workspace-accent': accentColor,
        } as React.CSSProperties
      }
    >
      <AppNavbar />

      <main className="dash-main">
        <div className="dash-grid">
          <div className="dash-main-col">
            <DashboardMetrics />
            <AttendanceChartCard />
            <KioskStationCard />
          </div>

          <div className="dash-side-col">
            <LiveHeadcard />
          </div>
        </div>
      </main>

      <footer className="dash-footer">
        <div className="dash-footer-inner">
          <div className="dash-footer-left">
            <div className="dash-footer-label">{brandTitle} Identity</div>
            <p className="dash-footer-copy">
              &copy; {new Date().getFullYear()} {brandTitle} Identity Infrastructure. All rights reserved.
            </p>
          </div>
          <div className="dash-footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">API Documentation</a>
            <a href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
