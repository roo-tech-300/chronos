import { LogIn, MapPin } from 'lucide-react'

interface ClockInStatusCardProps {
  name: string
  role: string
  subDepartment: string
  initials: string
  /** Real clock-in time when known; the segment is hidden when absent. */
  clockInTime?: string
  punctualityLabel?: string
  shiftName?: string
}

export default function ClockInStatusCard({
  name,
  role,
  subDepartment,
  initials,
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
          <p className="tasks-clock-role">
            {role} · {subDepartment}
          </p>
        </div>
      </div>

      <div className="tasks-clock-status flex-wrap">
        <span className="tasks-clock-live">
          <span className="tasks-live-dot" />
          On the clock
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
        <span className="tasks-clock-sep">·</span>
        <span className="tasks-clock-meta">
          <MapPin size={12} /> {subDepartment}
        </span>
      </div>
    </section>
  )
}