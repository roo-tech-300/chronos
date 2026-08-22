import { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import type { TaskItem } from '../../dummy/tasks-mock'
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
    <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm hover:border-zinc-300 transition-all flex flex-col justify-between gap-4">
      <div>
        {/* Top Pills strictly matching the department header tab style */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {/* 3 Main Lifecycle Statuses */}
          {isApproved && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 font-semibold text-zinc-700">
              Approved
            </span>
          )}
          {isSubmitted && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-200/80 font-bold text-zinc-900">
              Submitted (Waiting Approval)
            </span>
          )}
          {isNotDone && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 font-semibold text-zinc-500">
              Not Done
            </span>
          )}

          <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-200/80 font-semibold text-zinc-800">
            {task.type === 'recurring' ? 'Recurring Routine' : 'Special Assignment'}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-200/80 font-semibold text-zinc-800 uppercase">
            {task.priority}
          </span>
        </div>

        <h3 className="text-[15px] font-bold text-zinc-900 leading-snug mb-1.5">
          {task.title}
        </h3>
        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-3">
          {task.description}
        </p>

        {task.recurrence && (
          <div className="text-[12px] text-zinc-500 font-medium mb-3">
            {task.recurrence}
          </div>
        )}

        {/* Staff's completion comment dropdown (for submitted / approved tasks) */}
        {task.proofNote && (
          <div className="mt-3 border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50/70">
            <button
              type="button"
              onClick={() => setIsCommentOpen(!isCommentOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100/80 transition-colors cursor-pointer"
            >
              <span>Staff's comment</span>
              {isCommentOpen ? (
                <ChevronUp size={14} className="text-zinc-500" />
              ) : (
                <ChevronDown size={14} className="text-zinc-500" />
              )}
            </button>
            {isCommentOpen && (
              <div className="px-3 pb-3 pt-1 text-xs text-zinc-600 border-t border-zinc-200/60 leading-relaxed bg-white">
                <p className="italic">"{task.proofNote}"</p>
                {task.completedAt && (
                  <span className="text-[11px] text-zinc-400 block mt-1.5 not-italic">
                    Submitted: {task.completedAt}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Staff's reason / difficulty note (for not done tasks) */}
        {task.difficultyNote && (
          <div className="mt-2.5 border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50/70">
            <button
              type="button"
              onClick={() => setIsDifficultyOpen(!isDifficultyOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100/80 transition-colors cursor-pointer"
            >
              <span>Reason / Difficulty Note</span>
              {isDifficultyOpen ? (
                <ChevronUp size={14} className="text-zinc-500" />
              ) : (
                <ChevronDown size={14} className="text-zinc-500" />
              )}
            </button>
            {isDifficultyOpen && (
              <div className="px-3 pb-3 pt-1 text-xs text-zinc-600 border-t border-zinc-200/60 leading-relaxed bg-white">
                <p className="italic">"{task.difficultyNote}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="text-xs text-zinc-500">
          Due: <span className="font-semibold text-zinc-700">{task.dueDate}</span>
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
