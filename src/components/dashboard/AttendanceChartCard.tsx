import { useState } from 'react'
import { Tabs } from '../ui'
import { chartHeights, chartLabels } from '../../dummy/staff-mock'
import { useDevPersona } from '../../context/DevPersonaContext'
import { useWorkspace } from '../../context/useWorkspace'

const tooltipValues = [
  '1,284', '2,441', '1,204', '5,087', '4,211', '2,108',
  '3,845', '2,923', '6,018', '1,798', '1,044', '3,442'
]

export function AttendanceChartCard() {
  const { role, currentDepartment } = useDevPersona()
  const { accentColor } = useWorkspace()
  const [chartPeriod, setChartPeriod] = useState('Week')

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
        <Tabs
          tabs={['Day', 'Week', 'Month']}
          activeTab={chartPeriod}
          onChange={setChartPeriod}
          variant="segmented"
        />
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
