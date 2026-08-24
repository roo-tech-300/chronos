import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { TaskItem, TaskSubmissionPayload } from '../../dummy/tasks-mock'
import TaskSubmissionForm from './TaskSubmissionForm'

interface TaskCompletionDrawerProps {
  open: boolean
  task: TaskItem | null
  onClose: () => void
  onSubmit: (task: TaskItem, payload: TaskSubmissionPayload) => void
}

export default function TaskCompletionDrawer({
  open,
  task,
  onClose,
  onSubmit,
}: TaskCompletionDrawerProps) {
  // Escape key + click-outside-to-close keep the overlay keyboard-first and
  // never let it trap the desktop workflow (AGENTS.md global overlay rules).
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open || !task) return null

  return (
    <div
      className="tasks-drawer"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="tasks-drawer-backdrop" onClick={onClose} />
      <div className="tasks-drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="tasks-drawer-header">
          <div>
            <h2 className="tasks-drawer-title">Task Action Drawer</h2>
            <p className="tasks-drawer-sub">{task.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tasks-close-btn"
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="tasks-drawer-body">
          <TaskSubmissionForm
            key={task.id}
            task={task}
            onCancel={onClose}
            onSubmit={(payload) => onSubmit(task, payload)}
          />
        </div>
      </div>
    </div>
  )
}