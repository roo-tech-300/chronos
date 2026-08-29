import { useState } from 'react'
import { Download } from 'lucide-react'
import { Tabs } from '../ui'
import { chartHeights, chartLabels } from '../../dummy/staff-mock'
import { useDevPersona } from '../../context/DevPersonaContext'
import { useWorkspace } from '../../context/useWorkspace'
import { useAttendanceMetrics } from '../../hooks/useAttendanceMetrics'

const tooltipValues = [
  '1,284', '2,441', '1,204', '5,087', '4,211', '2,108',
  '3,845', '2,923', '6,018', '1,798', '1,044', '3,442'
]

export function AttendanceChartCard() {
  const { role, currentDepartment } = useDevPersona()
  const { currentWorkspace, accentColor } = useWorkspace()
  const { exportReport } = useAttendanceMetrics(currentWorkspace?.id)
  const [chartPeriod, setChartPeriod] = useState('Week')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await exportReport(currentWorkspace?.name || 'Academic Workspace')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="dash-card dash-chart-card">
      <div className="dash-section-header">
        <div>
          <h2>
            {role === 'admin'
              ? 'Daily Attendance Volume'
              : `${currentDepartment.name} Attendance Volume`}
          </h2>
          <p>Last 14 days aggregated by day {role === 'hod' ? '• Department Scope' : ''}</p>
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
            onChange={setChartPeriod}
            variant="segmented"
          />
        </div>
      </div>
      <div className="dash-chart-body">
        <div className="dash-chart-bars">
          {chartHeights.map((h, i) => {
            const isPeak = h > 80
            return (
              <div
                key={i}
                className="dash-chart-bar group"
                style={{
                  height: `${h}%`,
                  backgroundColor: isPeak ? `${accentColor}40` : `${accentColor}18`,
                }}
              >
                <span className="tooltip">{tooltipValues[i]}</span>
              </div>
            )
          })}
        </div>
        <div className="dash-chart-labels">
          {chartLabels.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
