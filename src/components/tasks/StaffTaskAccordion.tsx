import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { TaskItem } from '../../dummy/tasks-mock'
import TaskCard from './TaskCard'

interface StaffTaskAccordionProps {
  name: string
  role: string
  subDepartment: string
  tasks: TaskItem[]
  defaultOpen?: boolean
  onApproveTask: (task: TaskItem) => void
  onViewDetails: (task: TaskItem) => void
}

export default function StaffTaskAccordion({
  name,
  role,
  subDepartment,
  tasks,
  defaultOpen = false,
  onApproveTask,
  onViewDetails,
}: StaffTaskAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  // Calculate counts for the 3 task categories:
  // 1. Approved
  // 2. Submitted & Waiting for Approval
  // 3. Not Done
  const approvedCount = tasks.filter((t) => t.status === 'approved').length
  const submittedCount = tasks.filter((t) => t.status === 'submitted').length
  const notDoneCount = tasks.filter((t) => t.status === 'not_done').length

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className="tasks-group">
      {/* Header Row */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="tasks-group-header"
        aria-expanded={isOpen}
      >
        <div className="tasks-group-identity">
          <div className="tasks-group-avatar">{initials}</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="tasks-group-name">{name}</span>
              <span className="tasks-sub-pill">{subDepartment}</span>
            </div>
            <p className="tasks-group-role">{role}</p>
          </div>
        </div>

        {/* 3 Category badges */}
        <div className="tasks-group-counts">
          <span className="tasks-count">{approvedCount} Approved</span>
          <span className={`tasks-count ${submittedCount > 0 ? 'tasks-count--warn' : ''}`}>
            {submittedCount} Submitted
          </span>
          <span className="tasks-count">{notDoneCount} Not Done</span>
          <span className="tasks-chevron">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        </div>
      </button>

      {/* Expanded Task Cards */}
      {isOpen && (
        <div className="tasks-group-body">
          {tasks.length === 0 ? (
            <p className="tasks-empty">No tasks found for this filter view.</p>
          ) : (
            <div className="tasks-group-grid">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onApprove={onApproveTask}
                  onViewDetails={onViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}