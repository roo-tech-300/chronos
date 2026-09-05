import { DashboardMetrics } from '../dashboard/DashboardMetrics'
import { AttendanceChartCard } from '../dashboard/AttendanceChartCard'
import { KioskStationCard } from '../dashboard/KioskStationCard'
import { LiveHeadcard } from '../dashboard/LiveHeadcard'

interface UnitDashboardGridProps {
  unitName: string
  memberCount: number
  subUnitNames: string[]
}

/**
 * 1:1 replica of the HOD persona dashboard grid: the same dash-grid layout
 * and the same four widget cards the HOD sees on the Dashboard page, scoped
 * to a real organization unit. Tasks / staff / sub-unit tabs render below it.
 */
export function UnitDashboardGrid({ unitName, memberCount, subUnitNames }: UnitDashboardGridProps) {
  return (
    <div className="dash-grid mb-8">
      <div className="dash-main-col">
        <DashboardMetrics unitScope={{ name: unitName, memberCount, subUnitNames }} />
        <AttendanceChartCard scopeName={unitName} />
        <KioskStationCard />
      </div>
      <div className="dash-side-col">
        <LiveHeadcard scopeName={unitName} />
      </div>
    </div>
  )
}
