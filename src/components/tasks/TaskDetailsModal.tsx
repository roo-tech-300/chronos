import { CheckCircle2 } from 'lucide-react'
import type { TaskItem } from '../../dummy/tasks-mock'
import { Modal, Button } from '../ui'

interface TaskDetailsModalProps {
  task: TaskItem | null
  open: boolean
  onClose: () => void
  onApprove: (task: TaskItem) => void
}

export default function TaskDetailsModal({ task, open, onClose, onApprove }: TaskDetailsModalProps) {
  if (!task) return null

  const isSubmitted = task.status === 'submitted'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task.title}
      subtitle={task.subDepartment}
      maxWidth="md"
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2 flex-wrap">
          {task.status === 'approved' && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 font-semibold text-zinc-700">
              Approved
            </span>
          )}
          {task.status === 'submitted' && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-200/80 font-bold text-zinc-900">
              Submitted (Waiting Approval)
            </span>
          )}
          {task.status === 'not_done' && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 font-semibold text-zinc-500">
              Not Done
            </span>
          )}

          <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-200/80 font-semibold text-zinc-800">
            {task.type === 'recurring' ? 'Recurring Routine' : 'Special Assignment'}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-200/80 font-semibold text-zinc-800 uppercase">
            {task.priority} Priority
          </span>
        </div>

        <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 text-sm text-zinc-700 leading-relaxed">
          <span className="text-xs font-bold text-zinc-500 block uppercase tracking-wider mb-1">
            Task Description
          </span>
          {task.description}
        </div>

        {task.proofNote && (
          <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 text-sm text-zinc-800">
            <span className="text-xs font-bold text-zinc-500 block uppercase tracking-wider mb-1">
              Staff's comment
            </span>
            <p className="italic text-xs leading-relaxed text-zinc-700">
              "{task.proofNote}"
            </p>
            {task.completedAt && (
              <span className="text-[11px] text-zinc-400 mt-2 block not-italic">
                Submitted: {task.completedAt}
              </span>
            )}
          </div>
        )}

        {task.difficultyNote && (
          <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 text-sm text-zinc-800">
            <span className="text-xs font-bold text-zinc-500 block uppercase tracking-wider mb-1">
              Reason / Difficulty Note
            </span>
            <p className="italic text-xs leading-relaxed text-zinc-700">
              "{task.difficultyNote}"
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-zinc-400 block font-medium">Assignee</span>
            <span className="font-bold text-zinc-900">{task.assigneeName}</span>
            <span className="text-zinc-500 block">{task.assigneeRole}</span>
          </div>
          <div>
            <span className="text-zinc-400 block font-medium">Due Date / Cadence</span>
            <span className="font-bold text-zinc-900">{task.recurrence || task.dueDate}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {isSubmitted && (
            <Button
              variant="primary"
              leftIcon={<CheckCircle2 size={16} />}
              onClick={() => {
                onApprove(task)
                onClose()
              }}
            >
              Approve Done
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
