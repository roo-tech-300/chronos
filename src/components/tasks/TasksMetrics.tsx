import { CheckCircle2, ClipboardList, Timer } from 'lucide-react'
import type { StatusSummary } from '../../utils/taskAggregation'

interface TasksMetricsProps {
  /** Unfiltered lifecycle totals used as the page's stable anchors. */
  overall: StatusSummary
}

/** The three lifecycle anchors (Approved / Submitted / Not Done). */
export default function TasksMetrics({ overall }: TasksMetricsProps) {
  const metrics = [
    {
      label: 'Approved',
      value: overall.approved,
      desc: 'Verified by HOD',
      icon: <CheckCircle2 size={18} />,
      tone: 'ok',
    },
    {
      label: 'Submitted',
      value: overall.submitted,
      desc: 'Waiting for HOD approval',
      icon: <Timer size={18} />,
      tone: 'warn',
    },
    {
      label: 'Not Done',
      value: overall.notDone,
      desc: 'Still open for today',
      icon: <ClipboardList size={18} />,
      tone: 'muted',
    },
  ] as const

  return (
    <div className="tasks-metrics">
      {metrics.map((m) => (
        <div key={m.label} className="tasks-metric">
          <div className="tasks-metric-top">
            <span className="tasks-metric-label">{m.label}</span>
            <span className={`tasks-metric-icon tasks-metric-icon--${m.tone}`}>{m.icon}</span>
          </div>
          <span className="tasks-metric-value">{m.value}</span>
          <span className="tasks-metric-desc">{m.desc}</span>
        </div>
      ))}
    </div>
  )
}