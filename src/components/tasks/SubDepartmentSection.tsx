import { useState } from 'react'
import { ChevronDown, ChevronRight, Layers, User } from 'lucide-react'
import type { StaffTaskGroup, TaskItem } from '../../dummy/tasks-mock'
import StaffTaskAccordion from './StaffTaskAccordion'

interface SubDepartmentSectionProps {
  subDeptName: string
  leadStaff?: StaffTaskGroup
  teamMembers: StaffTaskGroup[]
  defaultOpen?: boolean
  onApproveTask: (task: TaskItem) => void
  onViewDetails: (task: TaskItem) => void
}

export default function SubDepartmentSection({
  subDeptName,
  leadStaff,
  teamMembers,
  defaultOpen = false,
  onApproveTask,
  onViewDetails,
}: SubDepartmentSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  // Aggregate stats across team members in this sub-department
  const allSubTasks = teamMembers.flatMap((m) => m.tasks)
  const approvedCount = allSubTasks.filter((t) => t.status === 'approved').length
  const submittedCount = allSubTasks.filter((t) => t.status === 'submitted').length
  const notDoneCount = allSubTasks.filter((t) => t.status === 'not_done').length

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm transition-all hover:border-zinc-300">
      {/* Sub-Department Summary Header Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-zinc-50/80 hover:bg-zinc-100/80 transition-colors text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-200 text-zinc-700 flex items-center justify-center font-bold">
            <Layers size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-zinc-900 text-base">{subDeptName}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-200/70 text-zinc-700 font-medium">
                {teamMembers.length} Staff Member{teamMembers.length !== 1 ? 's' : ''}
              </span>
              {leadStaff && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium flex items-center gap-1">
                  <User size={12} />
                  Lead: {leadStaff.name}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Sub-department team members & individual deliverables
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="tasks-count">{approvedCount} Approved</span>
          <span className={`tasks-count ${submittedCount > 0 ? 'tasks-count--warn' : ''}`}>
            {submittedCount} Submitted
          </span>
          <span className="tasks-count">{notDoneCount} Not Done</span>
          <div className="text-zinc-400 p-1">
            {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
        </div>
      </button>

      {/* Expanded Team Members List */}
      {isOpen && (
        <div className="p-4 bg-zinc-100/50 border-t border-zinc-200 flex flex-col gap-3">
          {teamMembers.length === 0 ? (
            <p className="text-sm text-zinc-500 py-3 text-center">
              No staff members assigned to this sub-department yet.
            </p>
          ) : (
            teamMembers.map((member) => (
              <StaffTaskAccordion
                key={member.name}
                name={member.name}
                role={member.role}
                subDepartment={member.subDepartment}
                tasks={member.tasks}
                defaultOpen={false}
                onApproveTask={onApproveTask}
                onViewDetails={onViewDetails}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
