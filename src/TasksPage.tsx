import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import AppNavbar from './components/layout/AppNavbar'
import { useWorkspace } from './context/useWorkspace'
import { useAuth } from './context/useAuth'
import { useWorkspaceTasks } from './hooks/useWorkspaceTasks'
import { useWorkspaceRoster } from './hooks/useWorkspaceRoster'
import type { StaffTaskGroup, TaskItem, CreateTaskInput } from './types/tasks'
import { Button, Toolbar } from './components/ui'
import DepartmentUnitCard from './components/tasks/DepartmentUnitCard'
import TasksMetrics from './components/tasks/TasksMetrics'
import StaffDirectoryModal from './components/tasks/StaffDirectoryModal'
import TaskModal from './components/tasks/TaskModal'
import {
  TASK_FILTER_TABS,
  buildStaffGroups,
  filterReviewTasks,
  summarizeStatuses,
  type StatusSummary,
  type TasksFilterTab,
} from './utils/taskAggregation'
import './styles/tasks-layout.css'
import './styles/tasks-widgets.css'
import './styles/tasks-directory.css'

/** One browseable unit rendered on the page; selecting it opens the directory. */
interface UnitOverview {
  name: string
  leadName: string | null
  memberCount: number
  groups: StaffTaskGroup[]
  summary: StatusSummary
}

export default function TasksPage() {
  const { currentWorkspace } = useWorkspace()
  const { profile } = useAuth()
  const activeWorkspaceId = currentWorkspace?.id || ''
  const workspaceName = currentWorkspace?.name || 'Workspace'

  const { tasks, createBatch, approveTask: approveTaskMutation } = useWorkspaceTasks(activeWorkspaceId)
  const { roster } = useWorkspaceRoster(activeWorkspaceId)
  const [activeTab, setActiveTab] = useState<TasksFilterTab>("Today's Tasks")
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [activeUnitName, setActiveUnitName] = useState<string | null>(null)

  // Lifecycle anchors stay unfiltered so headline totals remain stable.
  const overall = useMemo(() => summarizeStatuses(tasks), [tasks])

  // Everything below honours the toolbar filter (status tab + search).
  const filteredTasks = useMemo(
    () => filterReviewTasks(tasks, activeTab, searchQuery),
    [tasks, activeTab, searchQuery],
  )

  // Units are derived from the live roster's departments - no hardcoded slices.
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
                Browse by unit, open any team member, and review their deliverables in one
                clean flow.
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
          className="mb-8"
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

        {/* Browse-by-unit grid */}
        <div className="flex items-end justify-between gap-3 flex-wrap mb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900">Review by Unit</h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              Select a unit to see its people, then open anyone to walk through their day.
            </p>
          </div>
          <span className="tasks-badge">
            {units.length} {units.length === 1 ? 'Unit' : 'Units'} · {filteredTasks.length} in
            view
          </span>
        </div>

        <div className="unit-grid">
          {units.map((unit) => (
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