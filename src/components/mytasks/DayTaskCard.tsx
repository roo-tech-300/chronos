import { Clock3, ExternalLink, PenLine, Send, ShieldCheck } from 'lucide-react'
import type { TaskItem } from '../../types/tasks'
import { Button } from '../ui'
import TaskStatusBadge from './TaskStatusBadge'

interface DayTaskCardProps {
  task: TaskItem
  /** Optional reviewer name fallback for the verified status badge. */
  hodName?: string
  onOpenDrawer: (task: TaskItem) => void
}

export default function DayTaskCard({ task, hodName, onOpenDrawer }: DayTaskCardProps) {
  const isPending = task.status === 'not_done'
  const isApproved = task.status === 'approved'

  return (
    <article className="tasks-day-card">
      <div className="tasks-day-card-top">
        <span className={`tasks-pill tasks-priority--${task.priority}`}>{task.priority}</span>
        <TaskStatusBadge task={task} hodName={hodName} />
      </div>

      <div>
        <h3 className="tasks-day-title">{task.title}</h3>
        <p className="tasks-day-desc">{task.description}</p>
      </div>

      <div className="tasks-day-meta">
        {task.estimatedMins !== undefined && (
          <span className="inline-flex items-center gap-1 font-semibold text-zinc-600">
            <Clock3 size={13} /> Est. {task.estimatedMins} min
          </span>
        )}
        <span className="tasks-clock-sep">·</span>
        <span>Due {task.dueDate}</span>
      </div>

      {task.completionLinks && task.completionLinks.length > 0 && (
        <div className="tasks-day-links">
          {task.completionLinks.map((link) => (
            <a
              key={link}
              href={link}
              target="_blank"
              rel="noreferrer"
              className="tasks-day-link"
            >
              <ExternalLink size={12} /> {link}
            </a>
          ))}
        </div>
      )}

      {task.proofNote && task.status !== 'not_done' && (
        <p className="tasks-day-proof">&quot;{task.proofNote}&quot;</p>
      )}

      <div className="tasks-day-foot">
        <span className="tasks-day-hint">
          {isPending
            ? 'Add completion proof & submit for review'
            : task.completedAt
              ? `Submitted ${task.completedAt}`
              : 'Add completion proof & submit for review'}
        </span>

        {isApproved ? (
          <Button variant="outline" size="sm" leftIcon={<ShieldCheck size={14} />} disabled>
            Verified
          </Button>
        ) : (
          <Button
            variant={isPending ? 'primary' : 'outline'}
            size="sm"
            leftIcon={isPending ? <Send size={14} /> : <PenLine size={14} />}
            onClick={() => onOpenDrawer(task)}
          >
            {isPending ? 'Mark Done & Submit' : 'Edit Submission'}
          </Button>
        )}
      </div>
    </article>
  )
}