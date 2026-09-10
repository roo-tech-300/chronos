import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Plus, ListTodo } from 'lucide-react'
import { useWorkspaceTasks } from './hooks/useWorkspaceTasks'
import { useWorkspaceRoster } from './hooks/useWorkspaceRoster'
import { useWorkspaceUnits } from './hooks/useOrganizationUnits'
import { useWorkspace } from './context/useWorkspace'
import { useAuth } from './context/useAuth'
import { useDevPersona } from './context/DevPersonaContext'
import AppNavbar from './components/layout/AppNavbar'
import TasksMetrics from './components/tasks/TasksMetrics'
import DepartmentUnitCard from './components/tasks/DepartmentUnitCard'
import StaffDirectoryModal from './components/tasks/StaffDirectoryModal'
import TaskModal from './components/tasks/TaskModal'
import TasksFooter from './components/tasks/TasksFooter'
import { Button, Toolbar } from './components/ui'
import {
  TASK_FILTER_TABS,
  type TasksFilterTab,
  summarizeStatuses,
  filterReviewTasks,
} from './utils/taskAggregation'
import { buildUnitOverviews } from './utils/taskUnitScoping'
import { useHodScope } from './hooks/useHodScope'
import type { TaskItem, CreateTaskInput } from './types/tasks'
import './styles/tasks-layout.css'
import './styles/tasks-directory.css'

export default function TasksPage() {
  const { currentWorkspace } = useWorkspace()
  const { profile } = useAuth()
  const { role, currentDepartment } = useDevPersona()
  const activeWorkspaceId = currentWorkspace?.id || ''
  const workspaceName = currentWorkspace?.name || 'Workspace'

  const navigate = useNavigate()
  const myTasksPath = activeWorkspaceId
    ? `/workspace/${activeWorkspaceId}/tasks/my-tasks`
    : '/tasks/my-tasks'

  const {
    tasks,
    createBatch,
    approveTask: approveTaskMutation,
    approveError,
  } = useWorkspaceTasks(activeWorkspaceId)
  const { roster } = useWorkspaceRoster(activeWorkspaceId)
  const { units } = useWorkspaceUnits(activeWorkspaceId)
  const [activeTab, setActiveTab] = useState<TasksFilterTab>("Today's tasks")
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null)

  const { hodUnits, hodAssigneeIds, hodUnit } = useHodScope({
    role,
    departmentName: currentDepartment.name,
    subDepartments: currentDepartment.subDepartments,
    units,
    roster,
  })

  // HOD task lens: only tasks assigned inside their department ever surface.
  // Admins/owners see everything. A HOD whose department matches no unit sees
  // nothing (never fall back to the full workspace set — that would leak tasks).
  const visibleTasks = useMemo(() => {
    if (role !== 'hod') return tasks
    if (!hodAssigneeIds) return []
    return tasks.filter((t) =>
      t.assigneeMemberId ? hodAssigneeIds.has(t.assigneeMemberId) : false
    )
  }, [tasks, hodAssigneeIds, role])

  // Lifecycle anchors follow the viewer's visible task set
  const overall = useMemo(() => summarizeStatuses(visibleTasks), [visibleTasks])

  // Filter tasks by status tab and search query
  const filteredTasks = useMemo(
    () => filterReviewTasks(visibleTasks, activeTab, searchQuery),
    [visibleTasks, activeTab, searchQuery],
  )

  const unitOverviews = useMemo(
    () => buildUnitOverviews(hodUnits ?? units, roster, filteredTasks),
    [hodUnits, units, roster, filteredTasks],
  )

  const activeUnit = unitOverviews.find((u) => u.id === activeUnitId) ?? null

  async function handleCreateBatch(newTasks: CreateTaskInput[]) {
    const result = await createBatch(newTasks)
    if (result.success === false) {
      throw new Error(result.error || 'Failed to create tasks.')
    }
    setIsCreateOpen(false)
  }

  async function handleApproveTask(taskToApprove: TaskItem) {
    try {
      await approveTaskMutation({
        taskId: taskToApprove.id,
        verifiedBy: profile?.fullName || '',
      })
    } catch {
      // Approval failures roll back optimistic cache via mutation onError
    }
  }

  return (
    <div className="tasks-page">
      <AppNavbar />

      <main className="tasks-main">
        {/* Page header */}
        <div className="tasks-header">
          <div className="tasks-header-row">
            <div>
              <h1>Departmental Tasks</h1>
              <p>
                Browse by unit, open any team member, and review their deliverables in one clean flow.
              </p>
            </div>
            <div className="tasks-header-actions">
              <span className="tasks-badge">{workspaceName}</span>
              <Button
                variant="primary"
                leftIcon={<Plus size={16} />}
                onClick={() => setIsCreateOpen(true)}
              >
                Assign New Task
              </Button>
            </div>
          </div>
        </div>

        {/* Lifecycle metric anchors */}
        <TasksMetrics overall={overall} />

        {/* Filter toolbar */}
        <Toolbar
          className="mb-4"
          search={{
            placeholder: 'Search tasks',
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            onClear: () => setSearchQuery(''),
            width: 'w-full sm:w-72',
          }}
          tabs={{
            tabs: TASK_FILTER_TABS.map((tab) => ({
              id: tab,
              label:
                tab === 'Waiting Approval' && overall.submitted > 0
                  ? `Waiting Approval (${overall.submitted})`
                  : tab,
            })),
            activeTab,
            onChange: (id) => setActiveTab(id as TasksFilterTab),
            variant: 'pill',
          }}
          rightContent={
            <button
              type="button"
              onClick={() => navigate(myTasksPath)}
              title="Open your personal workspace to submit your own tasks"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-700 bg-white border border-zinc-300 hover:border-[#7c007e]/50 hover:text-[#7c007e] transition-colors cursor-pointer"
            >
              <ListTodo size={14} />
              My Tasks
            </button>
          }
        />

        {/* Approval authority feedback (DB-enforced via approve_task_if_authorized) */}
        {approveError && (
          <div className="mb-4 flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>{approveError}</span>
          </div>
        )}

        {/* Browse-by-unit grid */}
        <div className="flex items-end justify-between gap-3 flex-wrap mb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900">Review by Unit</h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              Select a unit to see its people, then open anyone to walk through their day.
            </p>
          </div>
          <span className="tasks-badge">
            {unitOverviews.length} {unitOverviews.length === 1 ? 'Unit' : 'Units'} ·{' '}
            {filteredTasks.length} in view
          </span>
        </div>

        <div className="unit-grid">
          {unitOverviews.map((unit) => (
            <DepartmentUnitCard
              key={unit.id}
              unitName={unit.name}
              leadName={unit.leadName}
              memberCount={unit.memberCount}
              summary={unit.summary}
              onSelect={() => setActiveUnitId(unit.id)}
            />
          ))}
        </div>
      </main>

      <TasksFooter />

      <TaskModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateBatch={handleCreateBatch}
        workspaceId={activeWorkspaceId}
        departmentName={hodUnit?.name || workspaceName}
        unitId={hodUnit?.id || undefined}
        unitName={hodUnit?.name || undefined}
        allowedMemberIds={hodAssigneeIds ? Array.from(hodAssigneeIds) : undefined}
        allowUnitChange={role !== 'hod'}
      />

      {activeUnit && (
        <StaffDirectoryModal
          open
          onClose={() => setActiveUnitId(null)}
          unitName={activeUnit.name}
          leadName={activeUnit.leadName}
          members={activeUnit.groups}
          onApproveTask={handleApproveTask}
        />
      )}
    </div>
  )
}
