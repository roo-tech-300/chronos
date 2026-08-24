import { LogIn, MapPin } from 'lucide-react'

interface ClockInStatusCardProps {
  name: string
  role: string
  subDepartment: string
  initials: string
  clockInTime: string
}

export default function ClockInStatusCard({
  name,
  role,
  subDepartment,
  initials,
  clockInTime,
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

      <div className="tasks-clock-status">
        <span className="tasks-clock-live">
          <span className="tasks-live-dot" />
          On the clock
        </span>
        <span className="tasks-clock-sep">·</span>
        <span className="tasks-clock-meta">
          <LogIn size={13} /> Clocked in {clockInTime}
        </span>
        <span className="tasks-clock-sep">·</span>
        <span className="tasks-clock-meta">
          <MapPin size={12} /> {subDepartment}
        </span>
      </div>
    </section>
  )
}