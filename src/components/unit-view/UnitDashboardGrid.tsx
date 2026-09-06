import { DashboardMetrics } from '../dashboard/DashboardMetrics'
import { AttendanceChartCard } from '../dashboard/AttendanceChartCard'
import { LiveHeadcard } from '../dashboard/LiveHeadcard'

interface UnitDashboardGridProps {
  unitName: string
  memberCount: number
  subUnitNames: string[]
  memberIds?: string[]
}

/**
 * 1:1 replica of the HOD persona dashboard grid: the same dash-grid layout
 * and widget cards the HOD sees on the Dashboard page, scoped to a real
 * organization unit. Tasks / staff / sub-unit tabs render below it, with the
 * enrolled-terminal card closing the page.
 */
export function UnitDashboardGrid({
  unitName,
  memberCount,
  subUnitNames,
  memberIds,
}: UnitDashboardGridProps) {
  return (
    <div className="dash-grid mb-8">
      <div className="dash-main-col">
        <DashboardMetrics unitScope={{ name: unitName, memberCount, subUnitNames, memberIds }} />
        <AttendanceChartCard scopeName={unitName} memberIds={memberIds} />
      </div>
      <div className="dash-side-col">
        <LiveHeadcard scopeName={unitName} memberIds={memberIds} expectedCount={memberCount} />
      </div>
    </div>
  )
}
