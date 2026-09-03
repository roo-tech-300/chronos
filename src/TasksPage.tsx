import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { useWorkspaceTasks } from './hooks/useWorkspaceTasks'
import { useWorkspaceRoster } from './hooks/useWorkspaceRoster'
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
  buildStaffGroups,
  type StatusSummary,
} from './utils/taskAggregation'
import type { TaskItem, CreateTaskInput, StaffTaskGroup, TaskFilters } from './types/tasks'
import './styles/tasks-layout.css'
import './styles/tasks-directory.css'

interface UnitOverview {
  name: string
  leadName: string | null
  memberCount: number
  groups: StaffTaskGroup[]
  summary: StatusSummary
}

export default function TasksPage() {
  const { currentWorkspace, accentColor = '#7c007e' } = useWorkspace()
  const { profile } = useAuth()
  const activeWorkspaceId = currentWorkspace?.id || ''
  const workspaceName = currentWorkspace?.name || 'Workspace'

  const [filters, setFilters] = useState<TaskFilters>({ unit: 'all' })
  const { tasks, createBatch, approveTask: approveTaskMutation } = useWorkspaceTasks(
    activeWorkspaceId,
    filters,
  )
  const { roster } = useWorkspaceRoster(activeWorkspaceId)
  const [activeTab, setActiveTab] = useState<TasksFilterTab>("Today's Tasks")
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [activeUnitName, setActiveUnitName] = useState<string | null>(null)

  // Lifecycle anchors stay unfiltered across the full task set for stable headline totals
  const overall = useMemo(() => summarizeStatuses(tasks), [tasks])

  // Everything below honours the toolbar filter (status tab + search + unit scope)
  const filteredTasks = useMemo(
    () => filterReviewTasks(tasks, activeTab, searchQuery, filters.unit),
    [tasks, activeTab, searchQuery, filters.unit],
  )

  // Units derived from live roster
  const units = useMemo<UnitOverview[]>(() => {
    const unitNames = Array.from(new Set(roster.map((m) => m.department)))
    return unitNames.map((unitName) => {
      const unitRoster = roster.filter((m) => m.department === unitName)
      const memberIds = new Set(unitRoster.map((m) => m.memberId))
      const memberNames = new Set(unitRoster.map((m) => m.name))
      const unitTasks = filteredTasks.filter(
        (t) =>
          (t.assigneeMemberId ? memberIds.has(t.assigneeMemberId) : false) ||
          memberNames.has(t.assigneeName),
      )
      const lead = unitRoster.find(
        (m) => m.role === 'hod' || m.role === 'owner' || m.role === 'admin',
      )
      return {
        name: unitName,
        leadName: lead?.name ?? null,
        memberCount: unitRoster.length,
        groups: buildStaffGroups(unitTasks, unitRoster),
        summary: summarizeStatuses(unitTasks),
      }
    })
  }, [roster, filteredTasks])

  const unitScopeOptions = useMemo(() => {
    const unitNames = Array.from(new Set(roster.map((m) => m.department)))
    return unitNames.map((name) => ({
      name,
      memberCount: roster.filter((m) => m.department === name).length,
      taskCount: tasks.filter((t) => t.department === name || t.subDepartment === name).length,
    }))
  }, [roster, tasks])

  const displayedUnits = useMemo(() => {
    if (!filters.unit || filters.unit === 'all') return units
    return units.filter((u) => u.name.toLowerCase() === filters.unit?.toLowerCase())
  }, [units, filters.unit])

  const activeUnit = units.find((u) => u.name === activeUnitName) ?? null

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

        {/* Unit scope toggle wired through TaskFilters */}
        <UnitScopeToggle
          activeUnit={filters.unit || 'all'}
          units={unitScopeOptions}
          totalTaskCount={tasks.length}
          onSelectUnit={(selectedUnit) => setFilters((prev) => ({ ...prev, unit: selectedUnit }))}
          accentColor={accentColor}
        />

        {/* Browse-by-unit grid */}
        <div className="flex items-end justify-between gap-3 flex-wrap mb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900">Review by Unit</h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              Select a unit to see its people, then open anyone to walk through their day.
            </p>
          </div>
          <span className="tasks-badge">
            {filters.unit && filters.unit !== 'all' ? `Scoped: ${filters.unit} · ` : ''}
            {displayedUnits.length} {displayedUnits.length === 1 ? 'Unit' : 'Units'} · {filteredTasks.length} in view
          </span>
        </div>

        <div className="unit-grid">
          {displayedUnits.map((unit) => (
            <DepartmentUnitCard
              key={unit.name}
              unitName={unit.name}
              leadName={unit.leadName}
              memberCount={unit.memberCount}
              summary={unit.summary}
              onSelect={() => setActiveUnitName(unit.name)}
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
          onClose={() => setActiveUnitName(null)}
          unitName={activeUnit.name}
          leadName={activeUnit.leadName}
          members={activeUnit.groups}
          onApproveTask={handleApproveTask}
        />
      )}
    </div>
  )
}
