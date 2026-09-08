import { CheckCircle2 } from 'lucide-react'
import type { TaskItem } from '../../types/tasks'
import { getInitials } from '../../utils/taskAggregation'
import { useWorkspace } from '../../context/useWorkspace'
import { Button } from '../ui'
import { TaskStatusPill, TaskTypePill } from './TaskPills'

interface TaskCardProps {
  task: TaskItem
  onApprove?: (task: TaskItem) => void
  onViewDetails?: (task: TaskItem) => void
}

/**
 * Compact single-row task entry for admin review lists (unit tab + staff panel).
 * Assignee identity, due rule and status scan in one glance; the full breakdown
 * (description, completion links, notes) lives in TaskDetailView so the list
 * stays a scannable stack of slim rows instead of tall cards.
 */
export default function TaskCard({ task, onApprove, onViewDetails }: TaskCardProps) {
  const { accentColor = '#7c007e' } = useWorkspace()
  const staffNote = task.proofNote

  return (
    <div className="group flex items-stretch bg-white border border-zinc-200 rounded-xl overflow-hidden transition-all hover:border-zinc-300 hover:shadow-sm cursor-pointer">
      {/* Organization branding rail (stretches full row height) */}
      <div className="w-1 shrink-0" style={{ backgroundColor: accentColor }} />

      {/* Clickable summary — avatar anchors the row, one shared center axis */}
      <div
        className="flex-1 min-w-0 flex items-center gap-3 px-3.5 py-3"
        onClick={() => onViewDetails?.(task)}
      >
        {task.assigneeAvatar ? (
          <img
            src={task.assigneeAvatar}
            alt=""
            className="w-9 h-9 rounded-full object-cover shrink-0"
          />
        ) : (
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0"
            style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
          >
            {getInitials(task.assigneeName)}
          </span>
        )}

        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-bold text-zinc-900 truncate min-w-0">
              {task.title}
            </h3>
            <TaskStatusPill status={task.status} />
          </div>

          <div className="flex items-center gap-2 min-w-0 flex-wrap text-xs text-zinc-500">
            <span className="font-semibold text-zinc-700 truncate max-w-[10rem]">
              {task.assigneeName}
            </span>
            <span className="text-zinc-300">·</span>
            <span className="truncate">{task.dueDate}</span>
            <TaskTypePill type={task.type} />
          </div>

          {staffNote && (
            <p className="text-xs italic text-zinc-500 truncate">&ldquo;{staffNote}&rdquo;</p>
          )}
        </div>
      </div>

      {/* Actions (outside the clickable summary so no propagation handling is needed) */}
      <div className="flex items-center gap-2 pr-3.5 shrink-0">
        {task.status === 'submitted' && onApprove && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<CheckCircle2 size={14} />}
            onClick={() => onApprove(task)}
          >
            Approve
          </Button>
        )}
        {onViewDetails && (
          <Button variant="outline" size="sm" onClick={() => onViewDetails(task)}>
            Details
          </Button>
        )}
      </div>
    </div>
  )
}