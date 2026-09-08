import { LogIn } from 'lucide-react'

interface ClockInStatusCardProps {
  name: string
  initials: string
  /** True when the member's LATEST scan today is a check-in. */
  isClockedIn?: boolean
  /** Real clock-in time when known; the segment is hidden when absent. */
  clockInTime?: string
  punctualityLabel?: string
  shiftName?: string
}

export default function ClockInStatusCard({
  name,
  initials,
  isClockedIn,
  clockInTime,
  punctualityLabel,
  shiftName,
}: ClockInStatusCardProps) {
  return (
    <section className="tasks-clock">
      <div className="tasks-clock-identity">
        <div className="tasks-clock-avatar">{initials}</div>
        <div>
          <h2 className="tasks-clock-name">{name}</h2>
        </div>
      </div>

      <div className="tasks-clock-status flex-wrap">
        <span className="tasks-clock-live">
          <span
            className="tasks-live-dot"
            style={isClockedIn ? undefined : { background: '#a1a1aa', animation: 'none' }}
          />
          {isClockedIn ? 'On the clock' : 'Off the clock'}
        </span>
        {clockInTime && (
          <>
            <span className="tasks-clock-sep">·</span>
            <span className="tasks-clock-meta">
              <LogIn size={13} /> Clocked in {clockInTime}
            </span>
          </>
        )}
        {punctualityLabel && (
          <>
            <span className="tasks-clock-sep">·</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              {punctualityLabel}
            </span>
          </>
        )}
        {shiftName && (
          <>
            <span className="tasks-clock-sep">·</span>
            <span className="text-xs text-zinc-500 font-mono">
              {shiftName}
            </span>
          </>
        )}
      </div>
    </section>
  )
}