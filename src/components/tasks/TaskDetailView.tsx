import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import type { TaskItem } from '../../dummy/tasks-mock'
import { Button } from '../ui'

interface TaskDetailViewProps {
  task: TaskItem
  /** Returns to the owning staff member's workload panel. */
  onBack: () => void
  /** Marks a submitted task as approved in the page-level state. */
  onApprove: (task: TaskItem) => void
}

/**
 * Step 3 of the directory modal: the full breakdown for one task.
 * Replaces the old standalone details dialog so reviewers never lose
 * their browsing context (back-forward navigation instead).
 */
export default function TaskDetailView({ task, onBack, onApprove }: TaskDetailViewProps) {
  const isSubmitted = task.status === 'submitted'

  function handleApprove() {
    onApprove(task)
    // Return to the refreshed workload panel once approval lands.
    onBack()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button type="button" className="drill-back" onClick={onBack}>
          <ArrowLeft size={14} />
          Back to {task.assigneeName.split(' ')[0]}&apos;s tasks
        </button>
        <span className="font-mono text-[11px] font-semibold text-zinc-400">{task.id}</span>
      </div>

      {/* Status / classification pills — identical visual language to TaskCard */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        {task.status === 'approved' && (
          <span className="tasks-pill tasks-status--approved">Approved</span>
        )}
        {task.status === 'submitted' && (
          <span className="tasks-pill tasks-status--submitted">Submitted (Waiting Approval)</span>
        )}
        {task.status === 'not_done' && (
          <span className="tasks-pill tasks-status--notdone">Not Done</span>
        )}
        <span className="tasks-pill tasks-type-pill">
          {task.type === 'recurring' ? 'Recurring Routine' : 'Special Assignment'}
        </span>
        <span className={`tasks-pill tasks-priority--${task.priority}`}>
          {task.priority} priority
        </span>
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

      {task.difficultyNote && (
        <div className="mt-3.5 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
          <span className="text-xs font-bold text-zinc-500 block uppercase tracking-wider mb-1">
            Reason / Difficulty Note
          </span>
          <p className="italic text-xs leading-relaxed text-zinc-700">
            &quot;{task.difficultyNote}&quot;
          </p>
        </div>
      )}

      <div className="detail-meta-grid mt-5 pt-5 border-t border-zinc-100">
        <div>
          <span className="text-zinc-400 block font-medium text-xs">Assignee</span>
          <span className="font-bold text-sm text-zinc-900 block mt-0.5">
            {task.assigneeName}
          </span>
          <span className="text-xs text-zinc-500">{task.assigneeRole}</span>
        </div>
        <div>
          <span className="text-zinc-400 block font-medium text-xs">Due Date / Cadence</span>
          <span className="font-bold text-sm text-zinc-900 block mt-0.5">
            {task.recurrence || task.dueDate}
          </span>
          <span className="text-xs text-zinc-500">{task.subDepartment}</span>
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
        {(task.estimatedMins !== undefined || task.actualMins !== undefined) && (
          <div>
            <span className="text-zinc-400 block font-medium text-xs">Time Budget</span>
            <span className="font-bold text-sm text-zinc-900 block mt-0.5">
              {task.actualMins !== undefined ? `${task.actualMins} min logged` : 'Not logged yet'}
            </span>
            <span className="text-xs text-zinc-500">
              {task.estimatedMins !== undefined ? `~${task.estimatedMins} min planned` : ''}
            </span>
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