import { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import type { TaskItem } from '../../types/tasks'
import { Button } from '../ui'

interface TaskCardProps {
  task: TaskItem
  onApprove?: (task: TaskItem) => void
  onViewDetails?: (task: TaskItem) => void
}

export default function TaskCard({ task, onApprove, onViewDetails }: TaskCardProps) {
  const [isCommentOpen, setIsCommentOpen] = useState(true)
  const [isDifficultyOpen, setIsDifficultyOpen] = useState(true)

  const isSubmitted = task.status === 'submitted'
  const isApproved = task.status === 'approved'
  const isNotDone = task.status === 'not_done'

  return (
    <div className="tasks-task">
      <div>
        {/* Top Pills matching the departmental status colors */}
        <div className="tasks-task-top mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {isApproved && (
              <span className="tasks-pill tasks-status--approved">Approved</span>
            )}
            {isSubmitted && (
              <span className="tasks-pill tasks-status--submitted">
                Submitted (Waiting Approval)
              </span>
            )}
            {isNotDone && (
              <span className="tasks-pill tasks-status--notdone">Not Done</span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="tasks-pill tasks-type-pill">
              {task.type === 'recurring' ? 'Recurring Routine' : 'Special Assignment'}
            </span>
            <span className={`tasks-pill tasks-priority--${task.priority}`}>
              {task.priority}
            </span>
          </div>
        </div>

        <h3 className="tasks-task-title">{task.title}</h3>
        <p className="tasks-task-desc">{task.description}</p>

        {task.recurrence && (
          <div className="tasks-task-recurrence mt-3">{task.recurrence}</div>
        )}

        {/* Staff's completion comment dropdown (submitted / approved tasks) */}
        {task.proofNote && (
          <div className="tasks-note mt-3">
            <button
              type="button"
              onClick={() => setIsCommentOpen(!isCommentOpen)}
              className="tasks-note-toggle"
            >
              <span>Staff's comment</span>
              {isCommentOpen ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
            {isCommentOpen && (
              <div className="tasks-note-body">
                <p className="italic">&quot;{task.proofNote}&quot;</p>
                {task.completedAt && (
                  <span className="tasks-note-time">Submitted: {task.completedAt}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Staff's reason / difficulty note (not done tasks) */}
        {task.difficultyNote && (
          <div className="tasks-note mt-2.5">
            <button
              type="button"
              onClick={() => setIsDifficultyOpen(!isDifficultyOpen)}
              className="tasks-note-toggle"
            >
              <span>Reason / Difficulty Note</span>
              {isDifficultyOpen ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
            {isDifficultyOpen && (
              <div className="tasks-note-body">
                <p className="italic">&quot;{task.difficultyNote}&quot;</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="tasks-task-meta">
        <div className="tasks-task-due">
          Due: <strong>{task.dueDate}</strong>
        </div>

        <div className="flex items-center gap-2">
          {isSubmitted && onApprove && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<CheckCircle2 size={14} />}
              onClick={() => onApprove(task)}
            >
              Approve Done
            </Button>
          )}
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(task)}
            >
              Details
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}