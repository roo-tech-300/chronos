import { useMemo } from 'react'
import { useDevPersona } from '../../context/DevPersonaContext'
import { useWorkspace } from '../../context/useWorkspace'

export function DashboardMetrics() {
  const { role, currentDepartment } = useDevPersona()
  const { stats } = useWorkspace()

  const displayMetrics = useMemo(() => {
    if (role === 'admin') {
      return [
        {
          label: 'TOTAL STAFF',
          value: stats.totalStaff > 0 ? stats.totalStaff.toLocaleString() : '0',
          description: 'Total active employees',
        },
        {
          label: 'ONLINE DEVICES',
          value: stats.onlineDevices.toLocaleString(),
          description: 'Active check-in devices and hardware',
        },
        {
          label: "TODAY'S SCANS",
          value: stats.todayScans ?? '—',
          description: 'People who checked in today',
        },
      ]
    }

    return [
      {
        label: 'DEPT HEADCOUNT',
        value: '48',
        description: `Active personnel in ${currentDepartment.name}`,
      },
      {
        label: 'DEPARTMENT ON-SITE',
        value: '36',
        description: '75.0% live departmental occupancy',

      },
      {
        label: 'SUB-UNITS READY',
        value: `${currentDepartment.subDepartments.length} / ${currentDepartment.subDepartments.length}`,
        description: currentDepartment.subDepartments.join(', '),
      },
    ]
  }, [role, currentDepartment, stats])

  return (
    <div className="dash-metrics">
      {displayMetrics.map((m) => (
        <div key={m.label} className="dash-card dash-metric">
          <div className="dash-metric-top">
            <span className="dash-metric-label">{m.label}</span>
          </div>
          <div className="dash-metric-value" style={{ color: m.value !== '—' ? '#191c1d' : '#9ca3af' }}>
            {m.value}
          </div>
          <div className="dash-metric-desc">{m.description}</div>
        </div>
      ))}
    </div>
  )
}
