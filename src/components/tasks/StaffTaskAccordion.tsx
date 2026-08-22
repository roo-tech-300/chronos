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
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden transition-all">
      {/* Header Row */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-zinc-50/70 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-zinc-900 truncate">
                {name}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-200/80 font-semibold text-zinc-800">
                {subDepartment}
              </span>
            </div>
            <p className="text-xs text-zinc-500 truncate mt-0.5">{role}</p>
          </div>
        </div>

        {/* 3 Categories Badges */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap justify-end">
          <span className="px-2.5 py-1 rounded-full bg-zinc-100 font-semibold text-zinc-700 text-[11px] sm:text-xs">
            {approvedCount} Approved
          </span>

          <span
            className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold ${
              submittedCount > 0
                ? 'bg-zinc-200 font-bold text-zinc-900'
                : 'bg-zinc-100 text-zinc-500'
            }`}
          >
            {submittedCount} Submitted
          </span>

          <span
            className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold ${
              notDoneCount > 0
                ? 'bg-zinc-100 border border-zinc-300 text-zinc-800'
                : 'bg-zinc-100 text-zinc-400'
            }`}
          >
            {notDoneCount} Not Done
          </span>

          <div className="p-1 rounded-md text-zinc-400">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </button>

      {/* Expanded Task Cards */}
      {isOpen && (
        <div className="p-4 sm:p-5 pt-0 border-t border-zinc-100 bg-zinc-50/40">
          {tasks.length === 0 ? (
            <p className="text-xs text-zinc-400 py-4 text-center">
              No tasks found for this filter view.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
