import { useMemo } from 'react'
import { useWorkspace } from './context/useWorkspace'
import { useDevPersona } from './context/DevPersonaContext'
import { useWorkspaceRoster } from './hooks/useWorkspaceRoster'
import { useWorkspaceUnits } from './hooks/useOrganizationUnits'
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
  const { role, currentDepartment } = useDevPersona()
  const { roster } = useWorkspaceRoster(currentWorkspace?.id || '')
  const { units } = useWorkspaceUnits(currentWorkspace?.id || '')
  const brandTitle = currentWorkspace?.name || 'Natale'

  // Subscribes to live Supabase telemetry websocket events for instant UI synchronization
  useRealtimeAttendance(currentWorkspace?.id)

  const scopedMemberIds = useMemo(() => {
    if (role !== 'hod') return undefined

    const matchingUnit = units.find(
      (u) => u.name.toLowerCase() === currentDepartment.name.toLowerCase()
    )

    const matchingUnitIds = matchingUnit
      ? new Set(units.filter((u) => u.id === matchingUnit.id || u.ancestorIds.includes(matchingUnit.id)).map((u) => u.id))
      : null

    const deptMemberIds = roster
      .filter((m) => {
        if (matchingUnitIds) {
          const inUnit = (m.unitId && matchingUnitIds.has(m.unitId)) || m.unitIds?.some((uid) => matchingUnitIds.has(uid))
          if (inUnit) return true
        }
        return m.department?.toLowerCase() === currentDepartment.name.toLowerCase()
      })
      .map((m) => m.memberId)

    return deptMemberIds
  }, [role, currentDepartment.name, units, roster])

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
            <DashboardMetrics memberIds={scopedMemberIds} />
            <AttendanceChartCard memberIds={scopedMemberIds} />
            <KioskStationCard />
          </div>

          <div className="dash-side-col">
            <LiveHeadcard memberIds={scopedMemberIds} />
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
