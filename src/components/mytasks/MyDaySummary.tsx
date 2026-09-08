import { Hourglass, ListTodo, ShieldCheck } from 'lucide-react'
import type { TaskItem } from '../../types/tasks'

interface MyDaySummaryProps {
  tasks: TaskItem[]
}

export default function MyDaySummary({ tasks }: MyDaySummaryProps) {
  const openCount = tasks.filter((t) => t.status === 'not_done').length
  const submittedCount = tasks.filter((t) => t.status === 'submitted').length
  const verifiedCount = tasks.filter((t) => t.status === 'approved').length

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
  ]

  return (
    <section className="tasks-metrics">
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