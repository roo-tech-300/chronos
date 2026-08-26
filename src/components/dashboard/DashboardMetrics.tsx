import { useMemo } from 'react'
import { Badge } from '../ui'
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
          badge: stats.totalStaff > 0 ? `${stats.totalStaff} Enrolled` : 'No Members',
          badgeVariant: 'primary' as const,
          description: 'Verified biological & organizational profiles',
        },
        {
          label: 'ONLINE DEVICES',
          value: stats.onlineDevices.toLocaleString(),
          badge: stats.onlineDevices > 0 ? `${stats.onlineDevices} Online` : '0 Linked',
          badgeVariant: stats.onlineDevices > 0 ? ('green' as const) : ('primary' as const),
          description: 'Active physical kiosks & scanning hardware',
        },
        {
          label: "TODAY'S SCANS",
          value: stats.todayScans ?? '—',
          badge: 'Awaiting Stream',
          badgeVariant: 'primary' as const,
          description: 'Live physical biometric & NFC log stream',
        },
      ]
    }

    return [
      {
        label: 'DEPT HEADCOUNT',
        value: '48',
        description: `Active personnel in ${currentDepartment.name}`,
        badge: '+2 this month',
        badgeVariant: 'green' as const,
      },
      {
        label: 'DEPARTMENT ON-SITE',
        value: '36',
        description: '75.0% live departmental occupancy',
        badge: '75%',
        badgeVariant: 'neutral' as const,
      },
      {
        label: 'SUB-UNITS READY',
        value: `${currentDepartment.subDepartments.length} / ${currentDepartment.subDepartments.length}`,
        description: currentDepartment.subDepartments.join(', '),
        badge: '100% Operational',
        badgeVariant: 'green' as const,
      },
    ]
  }, [role, currentDepartment, stats])

  return (
    <div className="dash-metrics">
      {displayMetrics.map((m) => (
        <div key={m.label} className="dash-card dash-metric">
          <div className="dash-metric-top">
            <span className="dash-metric-label">{m.label}</span>
            <Badge variant={m.badgeVariant === 'green' ? 'success' : 'neutral'} size="sm">
              {m.badge}
            </Badge>
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
