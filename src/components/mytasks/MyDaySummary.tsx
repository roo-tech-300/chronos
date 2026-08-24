import { Clock3, Hourglass, ListTodo, ShieldCheck } from 'lucide-react'
import type { TaskItem } from '../../dummy/tasks-mock'
import { formatMinutes } from '../../dummy/myday-mock'

interface MyDaySummaryProps {
  tasks: TaskItem[]
}

export default function MyDaySummary({ tasks }: MyDaySummaryProps) {
  const openCount = tasks.filter((t) => t.status === 'not_done').length
  const submittedCount = tasks.filter((t) => t.status === 'submitted').length
  const verifiedCount = tasks.filter((t) => t.status === 'approved').length
  const totalEstMins = tasks.reduce((sum, t) => sum + (t.estimatedMins ?? 0), 0)

  const stats = [
    {
      label: 'Open For Today',
      value: String(openCount),
      icon: ListTodo,
    },
    {
      label: 'Awaiting HOD',
      value: String(submittedCount),
      icon: Hourglass,
    },
    {
      label: 'Verified By HOD',
      value: String(verifiedCount),
      icon: ShieldCheck,
    },
    {
      label: 'Est. Total Duration',
      value: formatMinutes(totalEstMins),
      icon: Clock3,
    },
  ]

  return (
    <section className="tasks-metrics tasks-metrics--four">
      {stats.map((stat) => (
        <div key={stat.label} className="tasks-metric">
          <div className="tasks-metric-top">
            <span className="tasks-metric-label">{stat.label}</span>
            <span className="tasks-metric-icon">
              <stat.icon size={16} />
            </span>
          </div>
          <span className="tasks-metric-value">{stat.value}</span>
        </div>
      ))}
    </section>
  )
}