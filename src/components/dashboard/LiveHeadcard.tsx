import { useMemo } from 'react'
import { Badge } from '../ui'
import { headcountMembers } from '../../dummy/staff-mock'
import { useDevPersona } from '../../context/DevPersonaContext'
import { useWorkspace } from '../../context/useWorkspace'
import { useAuth } from '../../context/useAuth'
import { useAttendanceMetrics } from '../../hooks/useAttendanceMetrics'

export function LiveHeadcard() {
  const { role, currentDepartment } = useDevPersona()
  const { currentWorkspace, stats, accentColor } = useWorkspace()
  const { profile } = useAuth()
  const { summary, liveScans } = useAttendanceMetrics(currentWorkspace?.id, stats.totalStaff || 50)

  const displayHeadcount = useMemo(() => {
    if (liveScans && liveScans.length > 0) {
      return liveScans.slice(0, 6)
    }

    const list = role === 'admin' ? [...headcountMembers] : headcountMembers.slice(0, 3)
    if (profile?.fullName) {
      const userInitials =
        profile.fullName
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'U'

      return [
        {
          name: `${profile.fullName} (You)`,
          terminal: 'Workspace Synchronized',
          time: 'Just now',
          initials: userInitials,
        },
        ...list.slice(0, role === 'admin' ? 4 : 2),
      ]
    }
    return list
  }, [role, profile, liveScans])

  const liveOnSiteCount = summary.currentlyOnSite > 0 ? summary.currentlyOnSite : (role === 'admin' ? 42 : 36)
  const occupancyPercent = summary.totalExpected > 0 ? Math.round((liveOnSiteCount / summary.totalExpected) * 100) : 75

  return (
    <div className="dash-headcard">
      <div className="dash-headcard-header">
        <h3>Live Headcount</h3>
        <Badge variant="danger" showDot pulseDot size="sm">
          LIVE
        </Badge>
      </div>
      <p className="dash-headcard-count" style={{ color: accentColor }}>
        {role === 'admin'
          ? `${liveOnSiteCount} Staff Members On-Site`
          : `${liveOnSiteCount} Department Members On-Site`}
      </p>
      <div className="dash-headcard-list">
        {displayHeadcount.map((s, idx) => (
          <div key={`${s.name}-${s.time}-${idx}`} className="dash-headcard-row">
            <div
              className="dash-headcard-avatar font-bold"
              style={{ backgroundColor: `${accentColor}12`, color: accentColor }}
            >
              {s.initials}
            </div>
            <div className="dash-headcard-info">
              <div className="dash-headcard-name">
                <span>{s.name}</span>
                <span className="time">{s.time}</span>
              </div>
              <div className="dash-headcard-terminal">{s.terminal}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="dash-headcard-footer">
        <div className="dash-headcard-total">
          <span>{role === 'admin' ? 'Total in building' : 'Dept on-site'}</span>
          <span>{liveOnSiteCount} / {summary.totalExpected || 50}</span>
        </div>
        <div className="dash-headcard-bar">
          <div
            className="dash-headcard-bar-fill"
            style={{
              width: `${Math.min(100, occupancyPercent)}%`,
              backgroundColor: accentColor,
            }}
          />
        </div>
        <p className="dash-headcard-occupancy">
          {role === 'admin'
            ? `Building occupancy is at ${occupancyPercent}%`
            : `${currentDepartment.name} occupancy is at ${occupancyPercent}%`}
        </p>
      </div>
    </div>
  )
}
