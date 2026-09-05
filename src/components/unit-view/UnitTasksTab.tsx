import { useState } from 'react'
import { Plus, AlertTriangle, CheckSquare, Layers } from 'lucide-react'
import type { TaskItem } from '../../types/tasks'
import type { OrgUnit } from '../../types/organization'
import TaskCard from '../tasks/TaskCard'
import TaskDetailView from '../tasks/TaskDetailView'
import { useTaskFilters } from '../../hooks/useTaskFilters'
import { useWorkspace } from '../../context/useWorkspace'
import { Button, Modal, SearchInput, Tabs } from '../ui'

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
  const { accentColor = '#7c007e' } = useWorkspace()
  const {
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    counts,
    filteredTasks,
  } = useTaskFilters(tasks)
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)

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
          {/* Status filter tabs — design-system pills, same as the /tasks page */}
          <Tabs
            tabs={[
              { id: 'all', label: 'All', count: counts.all },
              { id: 'submitted', label: 'Waiting Approval', count: counts.submitted },
              { id: 'approved', label: 'Approved', count: counts.approved },
              { id: 'not_done', label: 'Open', count: counts.not_done },
            ]}
            activeTab={statusFilter}
            onChange={(id) => setStatusFilter(id as 'all' | 'submitted' | 'approved' | 'not_done')}
            variant="pill"
          />

          <div className="flex items-center gap-2">
            {hasSubUnits && (
              <button
                type="button"
                onClick={() => onToggleSubtree(!includeSubtree)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  includeSubtree
                    ? 'text-white shadow-sm ring-1 ring-black/5'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900'
                }`}
                style={includeSubtree ? { backgroundColor: accentColor } : undefined}
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
