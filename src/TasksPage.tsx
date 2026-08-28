import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import AppNavbar from './components/layout/AppNavbar'
import { useDevPersona } from './context/DevPersonaContext'
import { initialTasks, type StaffTaskGroup, type TaskItem } from './dummy/tasks-mock'
import { STAFF_DIRECTORY } from './dummy/staff-directory'
import { Button, Toolbar } from './components/ui'
import DepartmentUnitCard from './components/tasks/DepartmentUnitCard'
import TasksMetrics from './components/tasks/TasksMetrics'
import StaffDirectoryModal from './components/tasks/StaffDirectoryModal'
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
import TaskModal from './components/tasks/TaskModal'

/** One browseable unit rendered on the page; selecting it opens the directory. */
interface UnitOverview {
  name: string
  leadName: string | null
  memberCount: number
  groups: StaffTaskGroup[]
  summary: StatusSummary
}

export default function TasksPage() {
  const { currentDepartment } = useDevPersona()
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks)
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

  const units = useMemo<UnitOverview[]>(() => {
    const hasSubUnits = currentDepartment.subDepartments.length > 0
    const unitNames = hasSubUnits ? currentDepartment.subDepartments : [currentDepartment.name]

    return unitNames.map((unitName) => {
      const roster = hasSubUnits
        ? STAFF_DIRECTORY.filter((s) => s.subDepartment === unitName)
        : STAFF_DIRECTORY
      const unitTasks = hasSubUnits
        ? filteredTasks.filter((t) => t.subDepartment === unitName)
        : filteredTasks
      return {
        name: unitName,
        leadName:
          roster.find((s) => s.isLead)?.name ?? (hasSubUnits ? null : currentDepartment.lead),
        memberCount: roster.length,
        groups: buildStaffGroups(unitTasks, roster),
        summary: summarizeStatuses(unitTasks),
      }
    })
  }, [currentDepartment, filteredTasks])

  const activeUnit = units.find((u) => u.name === activeUnitName) ?? null

  function handleCreateBatch(newTasks: Omit<TaskItem, 'id' | 'status'>[]) {
    const createdList: TaskItem[] = newTasks.map((t) => ({
      ...t,
      id: `TSK-${Math.floor(100 + Math.random() * 900)}`,
      status: 'not_done',
      isToday: true,
    }))
    setTasks((prev) => [...createdList, ...prev])
  }

  function handleApproveTask(taskToApprove: TaskItem) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskToApprove.id
          ? {
              ...t,
              status: 'approved',
              completedAt: 'Just now by HOD',
              verifiedBy: currentDepartment.lead,
            }
          : t,
      ),
    )
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
              <span className="tasks-badge">{currentDepartment.name}</span>
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