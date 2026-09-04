import { Users, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { TaskItem } from '../../types/tasks'

interface UnitMetricsBarProps {
  memberCount: number
  tasks: TaskItem[]
}

export function UnitMetricsBar({ memberCount, tasks }: UnitMetricsBarProps) {
  const openTasks = tasks.filter((t) => t.status === 'not_done').length
  const submittedTasks = tasks.filter((t) => t.status === 'submitted').length
  const approvedTasks = tasks.filter((t) => t.status === 'approved').length

  const cards = [
    {
      label: 'Total Personnel',
      value: memberCount,
      desc: 'Assigned to unit',
      icon: <Users size={18} className="text-zinc-600" />,
      bg: 'bg-zinc-50 border-zinc-200',
    },
    {
      label: 'Open Tasks',
      value: openTasks,
      desc: 'In progress or pending',
      icon: <Clock size={18} className="text-amber-600" />,
      bg: 'bg-amber-50/50 border-amber-200/80',
    },
    {
      label: 'Awaiting Approval',
      value: submittedTasks,
      desc: 'Waiting for HOD sign-off',
      icon: <AlertCircle size={18} className="text-purple-600" />,
      bg: 'bg-purple-50/50 border-purple-200/80',
    },
    {
      label: 'Approved Deliverables',
      value: approvedTasks,
      desc: 'Verified by leadership',
      icon: <CheckCircle2 size={18} className="text-emerald-600" />,
      bg: 'bg-emerald-50/50 border-emerald-200/80',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`p-4 rounded-xl border ${card.bg} flex items-start justify-between transition-shadow hover:shadow-xs`}
        >
          <div>
            <span className="text-xs font-medium text-zinc-500 block mb-1">
              {card.label}
            </span>
            <span className="text-2xl font-bold tracking-tight text-zinc-900 block mb-0.5">
              {card.value}
            </span>
            <span className="text-[11px] text-zinc-500">{card.desc}</span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-zinc-200/60 shadow-2xs">
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  )
}
