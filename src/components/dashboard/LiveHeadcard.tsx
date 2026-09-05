import { useMemo } from 'react'
import { Badge } from '../ui'
import { useDevPersona } from '../../context/DevPersonaContext'
import { useWorkspace } from '../../context/useWorkspace'
import { useAttendanceMetrics } from '../../hooks/useAttendanceMetrics'

interface LiveHeadcardProps {
  /** When set, labels the live feed for a real unit instead of the dev persona. */
  scopeName?: string
}

export function LiveHeadcard({ scopeName }: LiveHeadcardProps) {
  const { role, currentDepartment } = useDevPersona()
  const { currentWorkspace, stats, accentColor } = useWorkspace()
  const { summary, onSiteMembers, liveScans } = useAttendanceMetrics(
    currentWorkspace?.id,
    stats.totalStaff || 1
  )
  const isUnitScope = Boolean(scopeName)

  const displayList = useMemo(() => {
    if (onSiteMembers && onSiteMembers.length > 0) {
      return onSiteMembers.slice(0, 6)
    }
    if (liveScans && liveScans.length > 0) {
      return liveScans.slice(0, 6)
    }
    return []
  }, [onSiteMembers, liveScans])

  const liveOnSiteCount = summary.currentlyOnSite
  const totalExpected = summary.totalExpected || stats.totalStaff || 1
  const occupancyPercent = totalExpected > 0 ? Math.min(100, Math.round((liveOnSiteCount / totalExpected) * 100)) : 0

  return (
    <div className="dash-headcard">
      <div className="dash-headcard-header">
        <h3>Live Headcount</h3>
        <Badge variant={liveOnSiteCount > 0 ? 'success' : 'neutral'} showDot={liveOnSiteCount > 0} pulseDot={liveOnSiteCount > 0} size="sm">
          {liveOnSiteCount > 0 ? 'LIVE' : 'IDLE'}
        </Badge>
      </div>

      <p className="dash-headcard-count" style={{ color: accentColor }}>
        {isUnitScope
          ? `${liveOnSiteCount} Unit ${liveOnSiteCount === 1 ? 'Member' : 'Members'} On-Site`
          : role === 'admin'
            ? `${liveOnSiteCount} Staff ${liveOnSiteCount === 1 ? 'Member' : 'Members'} On-Site`
            : `${liveOnSiteCount} Department ${liveOnSiteCount === 1 ? 'Member' : 'Members'} On-Site`}
      </p>

      <div className="dash-headcard-list">
        {displayList.length > 0 ? (
          displayList.map((s, idx) => (
            <div key={`${s.id || s.name}-${idx}`} className="dash-headcard-row">
              <div
                className="dash-headcard-avatar font-bold"
                style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
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
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
              style={{ backgroundColor: `${accentColor}10`, color: accentColor }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-zinc-700 m-0">No personnel on-site yet today</p>
            <p className="text-[11px] text-zinc-400 mt-1 mb-0 max-w-[200px]">
              Scanned arrivals from kiosk terminals will stream here in real time.
            </p>
          </div>
        )}
      </div>

      <div className="dash-headcard-footer">
        <div className="dash-headcard-total">
          <span>{isUnitScope ? 'Unit on-site' : role === 'admin' ? 'Total in building' : 'Dept on-site'}</span>
          <span>{liveOnSiteCount} / {totalExpected}</span>
        </div>
        <div className="dash-headcard-bar">
          <div
            className="dash-headcard-bar-fill"
            style={{
              width: `${occupancyPercent}%`,
              backgroundColor: accentColor,
            }}
          />
        </div>
        <p className="dash-headcard-occupancy">
          {isUnitScope
            ? `${scopeName} occupancy is at ${occupancyPercent}%`
            : role === 'admin'
              ? `Building occupancy is at ${occupancyPercent}%`
              : `${currentDepartment.name} occupancy is at ${occupancyPercent}%`}
        </p>
      </div>
    </div>
  )
}
