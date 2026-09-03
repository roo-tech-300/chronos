import { useState, useMemo } from 'react'
import { AlertTriangle, Plus } from 'lucide-react'
import { useWorkspaceTasks } from './hooks/useWorkspaceTasks'
import { useWorkspaceRoster } from './hooks/useWorkspaceRoster'
import { useWorkspaceUnits } from './hooks/useOrganizationUnits'
import { useWorkspace } from './context/useWorkspace'
import { useAuth } from './context/useAuth'
import AppNavbar from './components/layout/AppNavbar'
import TasksMetrics from './components/tasks/TasksMetrics'
import DepartmentUnitCard from './components/tasks/DepartmentUnitCard'
import StaffDirectoryModal from './components/tasks/StaffDirectoryModal'
import TaskModal from './components/tasks/TaskModal'
import UnitScopeToggle from './components/tasks/UnitScopeToggle'
import { Button, Toolbar } from './components/ui'
import {
  TASK_FILTER_TABS,
  type TasksFilterTab,
  summarizeStatuses,
  filterReviewTasks,
} from './utils/taskAggregation'
import {
  resolveScopeAssigneeIds,
  buildUnitOverviews,
  type UnitScopeMode,
} from './utils/taskUnitScoping'
import type { TaskItem, CreateTaskInput, TaskFilters } from './types/tasks'
import './styles/tasks-layout.css'
import './styles/tasks-directory.css'

export default function TasksPage() {
  const { currentWorkspace, accentColor = '#7c007e' } = useWorkspace()
  const { profile } = useAuth()
  const activeWorkspaceId = currentWorkspace?.id || ''
  const workspaceName = currentWorkspace?.name || 'Workspace'

  const [filters, setFilters] = useState<TaskFilters>({ unit: 'all' })
  const {
    tasks,
    createBatch,
    approveTask: approveTaskMutation,
    approveError,
  } = useWorkspaceTasks(activeWorkspaceId, filters)
  const { roster } = useWorkspaceRoster(activeWorkspaceId)
  const { units } = useWorkspaceUnits(activeWorkspaceId)
  const [activeTab, setActiveTab] = useState<TasksFilterTab>("Today's Tasks")
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null)
  const [scopeMode, setScopeMode] = useState<UnitScopeMode>('subtree')

  // Lifecycle anchors stay unfiltered across the full task set for stable headline totals
  const overall = useMemo(() => summarizeStatuses(tasks), [tasks])

  // Unit scope resolves to real organization_units subtree membership
  const scopedUnitId = filters.unit && filters.unit !== 'all' ? filters.unit : null
  const scopeAssigneeIds = useMemo(
    () => resolveScopeAssigneeIds(units, roster, scopedUnitId, scopeMode),
    [units, roster, scopedUnitId, scopeMode],
  )

  // Everything below honours the toolbar filter (status tab + search + unit scope)
  const filteredTasks = useMemo(
    () => filterReviewTasks(tasks, activeTab, searchQuery, scopeAssigneeIds),
    [tasks, activeTab, searchQuery, scopeAssigneeIds],
  )

  const unitOverviews = useMemo(
    () => buildUnitOverviews(units, roster, filteredTasks),
    [units, roster, filteredTasks],
  )

  const unitScopeOptions = useMemo(() => {
    return units.map((unit) => ({
      id: unit.id,
      name: unit.name,
      memberCount: roster.filter((m) => m.unitId === unit.id).length,
    }))
  }, [units, roster])

  const displayedUnits = useMemo(() => {
    if (!scopedUnitId) return unitOverviews
    return unitOverviews.filter((u) => u.id === scopedUnitId)
  }, [unitOverviews, scopedUnitId])

  const scopedUnit = scopedUnitId
    ? unitOverviews.find((u) => u.id === scopedUnitId) ?? null
    : null
  const activeUnit = unitOverviews.find((u) => u.id === activeUnitId) ?? null

  async function handleCreateBatch(newTasks: CreateTaskInput[]) {
    await createBatch(newTasks)
    setIsCreateOpen(false)
  }

  async function handleApproveTask(taskToApprove: TaskItem) {
    await approveTaskMutation({
      taskId: taskToApprove.id,
      verifiedBy: profile?.fullName || '',
    })
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
            placeholder: 'Search tasks, staff, or units...',
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            onClear: () => setSearchQuery(''),
            width: 'w-full sm:w-72',
          }}
          tabs={{
            tabs: TASK_FILTER_TABS.map((tab) => ({
              id: tab,
              label:
                tab === 'Submitted (Waiting Approval)' && overall.submitted > 0
                  ? `Submitted (${overall.submitted})`
                  : tab,
            })),
            activeTab,
            onChange: (id) => setActiveTab(id as TasksFilterTab),
            variant: 'pill',
          }}
        />

        {/* Unit scope toggle wired to real organization_units */}
        <UnitScopeToggle
          activeUnit={filters.unit || 'all'}
          units={unitScopeOptions}
          totalTaskCount={tasks.length}
          onSelectUnit={(selectedUnitId) =>
            setFilters((prev) => ({ ...prev, unit: selectedUnitId }))
          }
          scopeMode={scopeMode}
          onScopeModeChange={setScopeMode}
          accentColor={accentColor}
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
            {scopedUnit ? `Scoped: ${scopedUnit.name} · ` : ''}
            {displayedUnits.length} {displayedUnits.length === 1 ? 'Unit' : 'Units'} ·{' '}
            {filteredTasks.length} in view
          </span>
        </div>

        <div className="unit-grid">
          {displayedUnits.map((unit) => (
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

      <footer className="tasks-footer">
        <div className="tasks-footer-inner">
          <div>
            <div className="tasks-footer-label">Natale Identity</div>
            <p className="tasks-footer-copy">
              &copy; 2025 Natale Identity Corp. All rights reserved.
            </p>
          </div>
          <div className="tasks-footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">API Documentation</a>
            <a href="#">Support</a>
          </div>
        </div>
      </footer>

      <TaskModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateBatch={handleCreateBatch}
        workspaceId={activeWorkspaceId}
        departmentName={workspaceName}
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
