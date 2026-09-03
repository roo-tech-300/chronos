import { ArrowLeft } from 'lucide-react'
import type { StaffTaskGroup, TaskItem } from '../../types/tasks'
import TaskCard from './TaskCard'

interface StaffTasksPanelProps {
  member: StaffTaskGroup
  unitName: string
  onBack: () => void
  onApprove: (task: TaskItem) => void
  onViewDetails: (task: TaskItem) => void
}

/**
 * Step 2 of the directory modal: a person-centric review surface that feels
 * like navigating to their profile rather than expanding an accordion.
 */
export default function StaffTasksPanel({
  member,
  unitName,
  onBack,
  onApprove,
  onViewDetails,
}: StaffTasksPanelProps) {
  const approvedCount = member.tasks.filter((t) => t.status === 'approved').length
  const submittedCount = member.tasks.filter((t) => t.status === 'submitted').length
  const notDoneCount = member.tasks.filter((t) => t.status === 'not_done').length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button type="button" className="drill-back" onClick={onBack}>
          <ArrowLeft size={14} />
          All {unitName} staff
        </button>
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          Workload Review
        </span>
      </div>

      <div className="drill-summary">
        <span
          className={`person-avatar person-avatar--lg ${member.isLead ? 'person-avatar--lead' : ''}`}
        >
          {member.initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-extrabold tracking-tight text-zinc-900">
              {member.name}
            </span>
            {member.isLead ? (
              <span className="hod-pill">HOD</span>
            ) : (
              <span className="tasks-sub-pill">{unitName}</span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">{member.role}</p>
        </div>

        <div className="hidden sm:flex items-center gap-2 flex-wrap justify-end">
          <span className="tasks-count">{approvedCount} Approved</span>
          <span className={`tasks-count ${submittedCount > 0 ? 'tasks-count--warn' : ''}`}>
            {submittedCount} Submitted
          </span>
          <span className="tasks-count">{notDoneCount} Not Done</span>
        </div>
      </div>

      {member.tasks.length === 0 ? (
        <p className="tasks-empty">No tasks match the current filter for this staff member.</p>
      ) : (
        <div className="person-tasks-stack">
          {member.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onApprove={onApprove}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  )
}