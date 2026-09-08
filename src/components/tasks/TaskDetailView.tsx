import { CheckCircle2 } from 'lucide-react'
import type { TaskItem } from '../../types/tasks'
import { Button } from '../ui'
import { TaskStatusPill, TaskTypePill } from './TaskPills'

interface TaskDetailViewProps {
  task: TaskItem
  /** Returns to the owning staff member's workload panel. */
  onBack: () => void
  /** Marks a submitted task as approved. May be async (mutation-backed). */
  onApprove: (task: TaskItem) => void | Promise<void>
}

/**
 * The full breakdown for one task. The back affordance is owned by the host
 * (modal header / breadcrumb), so this component renders only the content.
 */
export default function TaskDetailView({ task, onBack, onApprove }: TaskDetailViewProps) {
  const isSubmitted = task.status === 'submitted'

  async function handleApprove() {
    try {
      // Wait for the approval to settle so the modal never closes before the
      // optimistic cache has been committed or rolled back on failure.
      await onApprove(task)
    } catch {
      // Parent pages render their own approval error state (e.g. the
      // approveError banner) - the rejection must not escape unhandled.
    } finally {
      // Return to the refreshed workload panel once approval lands or fails.
      onBack()
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-zinc-900 tracking-tight leading-snug mb-3">
        {task.title}
      </h2>

      {/* Status / classification pills — identical visual language to TaskCard */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <TaskStatusPill status={task.status} />
        <TaskTypePill type={task.type} />
      </div>

      <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 text-sm text-zinc-700 leading-relaxed">
        <span className="text-xs font-bold text-zinc-500 block uppercase tracking-wider mb-1">
          Task Description
        </span>
        {task.description}
      </div>

      {task.proofNote && (
        <div className="mt-3.5 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
          <span className="text-xs font-bold text-zinc-500 block uppercase tracking-wider mb-1">
            Staff&apos;s comment
          </span>
          <p className="italic text-xs leading-relaxed text-zinc-700">&quot;{task.proofNote}&quot;</p>
          {task.completedAt && (
            <span className="text-[11px] text-zinc-400 mt-2 block not-italic">
              Submitted: {task.completedAt}
            </span>
          )}
        </div>
      )}

      <div className="detail-meta-grid mt-5 pt-5 border-t border-zinc-100">
        <div>
          <span className="text-zinc-400 block font-medium text-xs">Assignee</span>
          <span className="font-bold text-sm text-zinc-900 block mt-0.5">
            {task.assigneeName}
          </span>
        </div>
        <div>
          <span className="text-zinc-400 block font-medium text-xs">Due Date / Cadence</span>
          <span className="font-bold text-sm text-zinc-900 block mt-0.5">
            {task.recurrence || task.dueDate}
          </span>
        </div>
        {(task.completedAt || task.verifiedBy) && (
          <div>
            <span className="text-zinc-400 block font-medium text-xs">Verification</span>
            <span className="font-bold text-sm text-zinc-900 block mt-0.5">
              {task.verifiedBy ?? 'Pending review'}
            </span>
            <span className="text-xs text-zinc-500">{task.completedAt}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-100">
        <Button variant="outline" onClick={onBack}>
          Back to tasks
        </Button>
        {isSubmitted && (
          <Button
            variant="primary"
            leftIcon={<CheckCircle2 size={16} />}
            onClick={handleApprove}
          >
            Approve Done
          </Button>
        )}
      </div>
    </div>
  )
}