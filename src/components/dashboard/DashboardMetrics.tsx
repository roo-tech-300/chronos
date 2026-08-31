import { useMemo } from 'react'
import { useDevPersona } from '../../context/DevPersonaContext'
import { useWorkspace } from '../../context/useWorkspace'
import { useAttendanceMetrics } from '../../hooks/useAttendanceMetrics'

export function DashboardMetrics() {
  const { role, currentDepartment } = useDevPersona()
  const { currentWorkspace, stats } = useWorkspace()
  const { summary } = useAttendanceMetrics(currentWorkspace?.id, stats.totalStaff || 1)

  const displayMetrics = useMemo(() => {
    const todayScansDisplay = summary.totalScansToday.toLocaleString()

    if (role === 'admin') {
      return [
        {
          label: 'TOTAL STAFF',
          value: stats.totalStaff.toLocaleString(),
          description: 'Total registered personnel',
        },
        {
          label: 'ONLINE DEVICES',
          value: stats.onlineDevices.toLocaleString(),
          description: 'Active terminals & biometric kiosks',
        },
        {
          label: "TODAY'S SCANS",
          value: todayScansDisplay,
          description: `${summary.currentlyOnSite} on-site • ${summary.departedToday} departed`,
        },
      ]
    }

    return [
      {
        label: 'DEPT HEADCOUNT',
        value: stats.totalStaff.toLocaleString(),
        description: `Registered in ${currentDepartment.name}`,
      },
      {
        label: 'DEPARTMENT ON-SITE',
        value: `${summary.currentlyOnSite}`,
        description: `${summary.attendanceRate}% live departmental occupancy`,
      },
      {
        label: 'SUB-UNITS READY',
        value: `${currentDepartment.subDepartments.length} / ${currentDepartment.subDepartments.length}`,
        description: currentDepartment.subDepartments.join(', '),
      },
    ]
  }, [role, currentDepartment, stats, summary])

  return (
    <div className="dash-metrics">
      {displayMetrics.map((m) => (
        <div key={m.label} className="dash-card dash-metric">
          <div className="dash-metric-top">
            <span className="dash-metric-label">{m.label}</span>
          </div>
          <div className="dash-metric-value" style={{ color: '#191c1d' }}>
            {m.value}
          </div>
          <div className="dash-metric-desc">{m.description}</div>
        </div>
      ))}
    </div>
  )
}
