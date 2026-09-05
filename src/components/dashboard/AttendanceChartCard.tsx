import { useState } from 'react'
import { Download } from 'lucide-react'
import { Tabs } from '../ui'
import { useDevPersona } from '../../context/DevPersonaContext'
import { useWorkspace } from '../../context/useWorkspace'
import { useAttendanceMetrics } from '../../hooks/useAttendanceMetrics'
import { useAttendanceVolume } from '../../hooks/useAttendanceVolume'
import type { AttendancePeriod } from '../../types/attendance'

interface AttendanceChartCardProps {
  /** When set, titles the chart for a real unit instead of the dev persona's department. */
  scopeName?: string
}

export function AttendanceChartCard({ scopeName }: AttendanceChartCardProps) {
  const { role, currentDepartment } = useDevPersona()
  const { currentWorkspace, accentColor } = useWorkspace()
  const { exportReport } = useAttendanceMetrics(currentWorkspace?.id)
  const [chartPeriod, setChartPeriod] = useState<AttendancePeriod>('Week')
  const [isExporting, setIsExporting] = useState(false)

  const { volumeData } = useAttendanceVolume(currentWorkspace?.id, chartPeriod)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await exportReport(currentWorkspace?.name || 'Academic Workspace')
    } finally {
      setIsExporting(false)
    }
  }

  const title = scopeName
    ? `${scopeName} Attendance Volume`
    : role === 'admin'
      ? 'Daily Attendance Volume'
      : `${currentDepartment.name} Attendance Volume`

  return (
    <div className="dash-card dash-chart-card">
      <div className="dash-section-header">
        <div>
          <h2>{title}</h2>
          <p>
            {volumeData.periodDescription}
            {scopeName ? ' • Unit Scope' : role === 'hod' ? ' • Department Scope' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Export Attendance Report"
          >
            <Download size={13} />
            <span>{isExporting ? 'Exporting...' : 'Export Report'}</span>
          </button>
          <Tabs
            tabs={['Day', 'Week', 'Month']}
            activeTab={chartPeriod}
            onChange={(t) => setChartPeriod(t as AttendancePeriod)}
            variant="segmented"
          />
        </div>
      </div>

      <div className="dash-chart-body">
        <div className="dash-chart-bars">
          {volumeData.points.map((p, i) => {
            const isPeak = p.isPeak
            return (
              <div
                key={`${p.label}-${i}`}
                className={`dash-chart-bar group ${isPeak ? 'peak' : 'normal'}`}
                style={{
                  height: `${Math.max(6, p.percentage)}%`,
                  backgroundColor: isPeak ? `${accentColor}55` : `${accentColor}20`,
                }}
              >
                <span className="tooltip">
                  {p.fullLabel ? `${p.fullLabel}: ` : ''}
                  {p.count.toLocaleString()} {p.count === 1 ? 'scan' : 'scans'}
                </span>
              </div>
            )
          })}
        </div>
        <div className="dash-chart-labels">
          {volumeData.points.map((p, i) => (
            <span key={`${p.label}-${i}`}>{p.label}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
