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
import { collectSubtreeIds } from './utils/orgUnitTree'
import type { TaskItem, CreateTaskInput, TaskFilters } from './types/tasks'
import type { OrgUnit } from './types/organization'
import './styles/tasks-layout.css'
import './styles/tasks-directory.css'

export default function TasksPage() {
  const { currentWorkspace, accentColor = '#7c007e' } = useWorkspace()
  const { profile } = useAuth()
  const { role, currentDepartment } = useDevPersona()
  const activeWorkspaceId = currentWorkspace?.id || ''
  const workspaceName = currentWorkspace?.name || 'Workspace'

  const navigate = useNavigate()
  const myTasksPath = activeWorkspaceId
    ? `/workspace/${activeWorkspaceId}/tasks/my-tasks`
    : '/tasks/my-tasks'

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

  // HODs are locked to their department subtree; admins see the whole workspace.
  const hodUnits = useMemo<OrgUnit[] | null>(() => {
    if (role !== 'hod') return null
    const deptName = currentDepartment.name.toLowerCase()
    const subNames = new Set(currentDepartment.subDepartments.map((s) => s.toLowerCase()))
    const roots = units.filter(
      (u) => u.name.toLowerCase() === deptName || subNames.has(u.name.toLowerCase())
    )
    if (roots.length === 0) return null
    const ids = new Set<string>()
    for (const root of roots) {
      collectSubtreeIds(units, root.id).forEach((id) => ids.add(id))
    }
    return units.filter((u) => roots.some((r) => r.id === u.id) || ids.has(u.id))
  }, [role, currentDepartment, units])
  const isHodScoped = hodUnits !== null

  // HOD-visible assignees: everyone inside their department subtree.
  const hodAssigneeIds = useMemo(() => {
    if (!hodUnits) return null
    const hodUnitIds = new Set(hodUnits.map((u) => u.id))
    const subtreeNames = new Set(hodUnits.map((u) => u.name.toLowerCase()))
    return new Set(
      roster
        .filter(
          (m) =>
            (m.unitId && hodUnitIds.has(m.unitId)) ||
            m.unitIds?.some((uid) => hodUnitIds.has(uid)) ||
            (m.department && subtreeNames.has(m.department.toLowerCase()))
        )
        .map((m) => m.memberId)
    )
  }, [hodUnits, roster])

  // HOD task lens: only tasks assigned inside their department ever surface.
  const visibleTasks = useMemo(() => {
    if (!hodAssigneeIds) return tasks
    return tasks.filter((t) =>
      t.assigneeMemberId ? hodAssigneeIds.has(t.assigneeMemberId) : false
    )
  }, [tasks, hodAssigneeIds])

  // Lifecycle anchors follow the viewer's visible task set
  const overall = useMemo(() => summarizeStatuses(visibleTasks), [visibleTasks])

  // Unit scope resolves to real organization_units subtree membership.
  // HODs are pinned to their department: an out-of-scope or 'all' selection
  // derives to their department unit during render (no state ping-pong).
  const effectiveUnit = useMemo(() => {
    if (!isHodScoped) return filters.unit || 'all'
    const allowed = new Set(hodUnits.map((u) => u.id))
    const current = filters.unit || 'all'
    if (current === 'all' || !allowed.has(current)) {
      return hodUnits[0]?.id ?? 'all'
    }
    return current
  }, [isHodScoped, hodUnits, filters.unit])

  const scopedUnitId = effectiveUnit !== 'all' ? effectiveUnit : null
  const scopeAssigneeIds = useMemo(
    () => resolveScopeAssigneeIds(units, roster, scopedUnitId, scopeMode),
    [units, roster, scopedUnitId, scopeMode],
  )

  // Everything below honours the toolbar filter (status tab + search + unit scope)
  const filteredTasks = useMemo(
    () => filterReviewTasks(visibleTasks, activeTab, searchQuery, scopeAssigneeIds),
    [visibleTasks, activeTab, searchQuery, scopeAssigneeIds],
  )

  const unitOverviews = useMemo(
    () => buildUnitOverviews(hodUnits ?? units, roster, filteredTasks),
    [hodUnits, units, roster, filteredTasks],
  )

  const unitScopeOptions = useMemo(() => {
    const allowed = hodUnits ? new Set(hodUnits.map((u) => u.id)) : null
    return units
      .filter((unit) => !allowed || allowed.has(unit.id))
      .map((unit) => ({
        id: unit.id,
        name: unit.name,
        memberCount: roster.filter((m) => m.unitId === unit.id).length,
      }))
  }, [units, roster, hodUnits])

  const displayedUnits = useMemo(() => {
    if (!scopedUnitId) return unitOverviews
    return unitOverviews.filter((u) => u.id === scopedUnitId)
  }, [unitOverviews, scopedUnitId])

  const scopedUnit = scopedUnitId
    ? unitOverviews.find((u) => u.id === scopedUnitId) ?? null
    : null
  const activeUnit = unitOverviews.find((u) => u.id === activeUnitId) ?? null

  const hodUnit = useMemo(() => {
    if (role !== 'hod') return null
    return units.find((u) => u.name.toLowerCase() === currentDepartment.name.toLowerCase()) || null
  }, [role, currentDepartment.name, units])

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
      // Approval failures roll back the optimistic cache via the mutation's
      // onError handler; the rejection must not escape as unhandled.
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

        {/* Unit scope toggle wired to real organization_units */}
        <UnitScopeToggle
          activeUnit={effectiveUnit}
          units={unitScopeOptions}
          totalTaskCount={visibleTasks.length}
          onSelectUnit={(selectedUnitId) =>
            setFilters((prev) => ({ ...prev, unit: selectedUnitId }))
          }
          scopeMode={scopeMode}
          onScopeModeChange={setScopeMode}
          accentColor={accentColor}
          hideAllUnits={isHodScoped}
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

      <TasksFooter />

      <TaskModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateBatch={handleCreateBatch}
        workspaceId={activeWorkspaceId}
        departmentName={scopedUnit?.name || hodUnit?.name || workspaceName}
        unitId={scopedUnitId || hodUnit?.id || undefined}
        unitName={scopedUnit?.name || hodUnit?.name || undefined}
        allowedMemberIds={scopeAssigneeIds ? Array.from(scopeAssigneeIds) : undefined}
        allowUnitChange={role !== 'hod' && !scopedUnitId}
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
