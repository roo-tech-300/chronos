import { useMemo, useState } from 'react'
import { CalendarDays, ListTodo } from 'lucide-react'
import AppNavbar from './components/layout/AppNavbar'
import { useWorkspace } from './context/useWorkspace'

import { useCurrentWorkspaceMember } from './hooks/useCurrentWorkspaceMember'
import { useMyDayTasks } from './hooks/useMyDayTasks'
import { useMemberClockIn, formatClockInTime } from './hooks/useMemberClockIn'
import { useUserEnrolledUnits, type UserEnrolledUnit } from './hooks/useUserEnrolledUnits'
import { evaluatePunctuality } from './services/shiftPolicyService'
import { orderDayTasks } from './utils/dayTasks'
import {
  getInitials,
  TASK_FILTER_TABS,
  type TasksFilterTab,
  summarizeStatuses,
  filterReviewTasks,
} from './utils/taskAggregation'
import TasksMetrics from './components/tasks/TasksMetrics'
import type { TaskItem, TaskSubmissionPayload } from './types/tasks'
import ClockInStatusCard from './components/mytasks/ClockInStatusCard'
import DayTaskCard from './components/mytasks/DayTaskCard'
import TaskCompletionDrawer from './components/mytasks/TaskCompletionDrawer'
import MyDepartmentGrid from './components/mytasks/MyDepartmentGrid'
import MyUnitTasksModal from './components/mytasks/MyUnitTasksModal'
import { Toolbar } from './components/ui'
import './styles/tasks-layout.css'
import './styles/tasks-widgets.css'
import './styles/tasks-day.css'

export default function MyTasksPage() {
  const { currentWorkspace } = useWorkspace()
  const activeWorkspaceId = currentWorkspace?.id || ''

  // Real signed-in identity for this workspace (DB record, never a persona).
  const { member } = useCurrentWorkspaceMember(activeWorkspaceId)

  // Verified attendance record today (live DB read, 30s polling)
  const { data: todayScan } = useMemberClockIn(member?.memberId)
  const isClockedIn = todayScan?.direction === 'in'

  const punctuality = useMemo(() => {
    if (!todayScan?.scanTimestamp) return null
    return evaluatePunctuality(todayScan.scanTimestamp, todayScan.direction || 'in')
  }, [todayScan])

  const clockInTimeStr = isClockedIn ? formatClockInTime(todayScan?.scanTimestamp) : undefined

  const { tasks, submitCompletion } = useMyDayTasks(member?.memberId)
  const [drawerTask, setDrawerTask] = useState<TaskItem | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<UserEnrolledUnit | null>(null)
  const [activeTab, setActiveTab] = useState<TasksFilterTab>("Today's tasks")
  const [searchQuery, setSearchQuery] = useState('')

  const overall = useMemo(() => summarizeStatuses(tasks), [tasks])

  const filteredTasks = useMemo(
    () => filterReviewTasks(tasks, activeTab, searchQuery),
    [tasks, activeTab, searchQuery]
  )

  // User department detection: resolves all enrolled units and tasks per unit
  const { userUnits, isMultiDepartment } = useUserEnrolledUnits(
    member,
    activeWorkspaceId,
    filteredTasks
  )

  // Orphan tasks: assigned to this member but whose department matches none of
  // their enrolled units. Without this, those tasks would vanish entirely in
  // multi-department mode (the grid only renders per-unit buckets).
  const orphanTasks = useMemo(() => {
    if (!isMultiDepartment) return []
    const bucketed = new Set<string>()
    for (const u of userUnits) for (const t of u.tasks) bucketed.add(t.id)
    return filteredTasks.filter((t) => !bucketed.has(t.id))
  }, [isMultiDepartment, userUnits, filteredTasks])

  const activeUnit = useMemo(() => {
    if (!selectedUnit) return null
    return userUnits.find((u) => u.id === selectedUnit.id) ?? selectedUnit
  }, [selectedUnit, userUnits])

  const orderedTasks = useMemo(() => orderDayTasks(filteredTasks), [filteredTasks])

  async function handleSubmit(task: TaskItem, payload: TaskSubmissionPayload) {
    await submitCompletion({
      taskId: task.id,
      payload,
    })
    setDrawerTask(null)
  }

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="tasks-page">
      <AppNavbar />

      <main className="tasks-main">
        <div className="tasks-header">
          <div className="tasks-header-row">
            <div>
              <h1>My Tasks</h1>
              <p>
                Daily focus for {member?.name || 'you'} · {currentWorkspace?.name || 'Workspace'}
              </p>
            </div>
            {['owner', 'admin', 'hod'].includes(member?.role || '') && (
            <a
              href={`/workspace/${activeWorkspaceId}/tasks`}
              className="inline-flex h-7 items-center gap-1 rounded px-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ListTodo size={12} />
              All Tasks
            </a>
            )}
            <span className="tasks-badge">
              <CalendarDays size={13} /> {todayLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <ClockInStatusCard
            name={member?.name || 'Signed-in Staff'}
            initials={getInitials(member?.name || 'Staff')}
            isClockedIn={isClockedIn}
            clockInTime={clockInTimeStr}
            punctualityLabel={punctuality?.statusLabel}
            shiftName={punctuality?.shiftName}
          />

          <TasksMetrics overall={overall} />

          <Toolbar
            className="mb-2"
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
          />

          {isMultiDepartment ? (
            <>
              <MyDepartmentGrid
                units={userUnits}
                onSelectUnit={setSelectedUnit}
              />
              {orphanTasks.length > 0 && (
                <section aria-label="Other tasks">
                  <div className="flex items-end justify-between gap-3 flex-wrap mb-4">
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-zinc-900">Other Tasks</h2>
                      <p className="text-sm text-zinc-500 mt-0.5">
                        Assigned to you but not part of your enrolled departments.
                      </p>
                    </div>
                    <span className="tasks-badge">
                      {orphanTasks.length} {orphanTasks.length === 1 ? 'Task' : 'Tasks'}
                    </span>
                  </div>
                  <div className="tasks-day-grid">
                    {orphanTasks.map((task) => (
                      <DayTaskCard
                        key={task.id}
                        task={task}
                        onOpenDrawer={setDrawerTask}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : orderedTasks.length === 0 ? (
            <div className="tasks-empty-card">
              No tasks are scheduled for today. You are all caught up.
            </div>
          ) : (
            <section className="tasks-day-grid">
              {orderedTasks.map((task) => (
                <DayTaskCard
                  key={task.id}
                  task={task}
                  onOpenDrawer={setDrawerTask}
                />
              ))}
            </section>
          )}
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

      <MyUnitTasksModal
        open={Boolean(activeUnit)}
        unit={activeUnit}
        onClose={() => setSelectedUnit(null)}
        onOpenDrawer={setDrawerTask}
      />

      <TaskCompletionDrawer
        open={Boolean(drawerTask)}
        task={drawerTask}
        onClose={() => setDrawerTask(null)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}