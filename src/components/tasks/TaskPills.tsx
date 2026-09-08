import type { TaskStatus, TaskType } from '../../types/tasks'
import { useWorkspace } from '../../context/useWorkspace'

const STATUS_PILL: Record<TaskStatus, { label: string; className: string }> = {
  not_done: { label: 'Open', className: 'bg-zinc-100 text-zinc-600' },
  submitted: {
    label: 'Waiting Approval',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  approved: {
    label: 'Approved',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
}

/**
 * Self-contained status pill — pure Tailwind so it renders identically on
 * every host page (tasks page, unit department page, inside modals).
 */
export function TaskStatusPill({ status }: { status: TaskStatus }) {
  const pill = STATUS_PILL[status]
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 ${pill.className}`}
    >
      {pill.label}
    </span>
  )
}

/** Accent-tinted classification chip using the organization's branding colour. */
export function TaskTypePill({ type }: { type: TaskType }) {
  const { accentColor = '#7c007e' } = useWorkspace()
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0"
      style={{ backgroundColor: `${accentColor}12`, color: accentColor }}
    >
      {type === 'recurring' ? 'Recurring' : 'One-off'}
    </span>
  )
}
