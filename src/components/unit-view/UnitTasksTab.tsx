import { useState, useMemo } from 'react'
import { Plus, AlertTriangle, CheckSquare, Layers } from 'lucide-react'
import type { TaskItem } from '../../types/tasks'
import type { OrgUnit } from '../../types/organization'
import TaskCard from '../tasks/TaskCard'
import TaskDetailView from '../tasks/TaskDetailView'
import { Button, Modal, SearchInput } from '../ui'

interface UnitTasksTabProps {
  tasks: TaskItem[]
  unit: OrgUnit
  onAssignTask: () => void
  onApproveTask: (task: TaskItem) => Promise<void>
  approveError: string | null
  isApproving: boolean
  hasSubUnits?: boolean
  includeSubtree: boolean
  onToggleSubtree: (include: boolean) => void
}

type TaskStatusFilter = 'all' | 'submitted' | 'approved' | 'not_done'

export function UnitTasksTab({
  tasks,
  unit,
  onAssignTask,
  onApproveTask,
  approveError,
  hasSubUnits = false,
  includeSubtree,
  onToggleSubtree,
}: UnitTasksTabProps) {
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)

  const counts = useMemo(() => {
    return {
      all: tasks.length,
      submitted: tasks.filter((t) => t.status === 'submitted').length,
      approved: tasks.filter((t) => t.status === 'approved').length,
      not_done: tasks.filter((t) => t.status === 'not_done').length,
    }
  }, [tasks])

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.assigneeName.toLowerCase().includes(q)
      )
    })
  }, [tasks, statusFilter, searchQuery])

  return (
    <div className="space-y-4">
      {/* Authority or Approval Error notification */}
      {approveError && (
        <div className="flex items-start gap-2.5 p-3.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-600" />
          <div>
            <span className="font-bold block">Approval Failed</span>
            <span>{approveError}</span>
          </div>
        </div>
      )}

      {/* Control bar: Tabs, Search, Subtree toggle, and Assign Task */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Status filter tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100/80 rounded-lg overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              All ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('submitted')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'submitted'
                  ? 'bg-purple-50 text-[#7c007e] shadow-2xs'
                  : counts.submitted > 0
                  ? 'text-[#7c007e] font-bold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <span>Waiting Approval</span>
              {counts.submitted > 0 && (
                <span className="bg-[#7c007e] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {counts.submitted}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === 'approved'
                  ? 'bg-emerald-50 text-emerald-800 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Approved ({counts.approved})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('not_done')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === 'not_done'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Open ({counts.not_done})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {hasSubUnits && (
              <button
                type="button"
                onClick={() => onToggleSubtree(!includeSubtree)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  includeSubtree
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                }`}
                title="Toggle including tasks from sub-departments"
              >
                <Layers size={14} />
                <span>{includeSubtree ? 'Subtree Tasks' : 'Direct Unit Only'}</span>
              </button>
            )}

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={onAssignTask}
            >
              Assign Task
            </Button>
          </div>
        </div>

        {/* Search input */}
        <div className="w-full">
          <SearchInput
            placeholder="Search deliverables by task name, description, or staff member..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <CheckSquare size={36} className="mx-auto text-zinc-300 mb-3" />
          <h3 className="text-base font-bold text-zinc-900">No deliverables found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto mb-5">
            {tasks.length === 0
              ? `No tasks have been assigned to ${unit.name} yet.`
              : 'No deliverables match the selected filters.'}
          </p>
          <Button variant="primary" size="sm" leftIcon={<Plus size={15} />} onClick={onAssignTask}>
            Assign New Task
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onApprove={onApproveTask}
              onViewDetails={(t) => setSelectedTask(t)}
            />
          ))}
        </div>
      )}

      {/* Task Full Breakdown Modal */}
      {selectedTask && (
        <Modal
          open={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          maxWidth="lg"
        >
          <div className="p-6">
            <TaskDetailView
              task={selectedTask}
              onBack={() => setSelectedTask(null)}
              onApprove={async (t) => {
                await onApproveTask(t)
                setSelectedTask(null)
              }}
            />
          </div>
        </Modal>
      )}
    </div>
  )
}
