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
import { getInitials } from './utils/taskAggregation'
import type { TaskItem, TaskSubmissionPayload } from './types/tasks'
import ClockInStatusCard from './components/mytasks/ClockInStatusCard'
import MyDaySummary from './components/mytasks/MyDaySummary'
import DayTaskCard from './components/mytasks/DayTaskCard'
import TaskCompletionDrawer from './components/mytasks/TaskCompletionDrawer'
import MyDepartmentGrid from './components/mytasks/MyDepartmentGrid'
import MyUnitTasksModal from './components/mytasks/MyUnitTasksModal'
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

  // User department detection: resolves all enrolled units and tasks per unit
  const { userUnits, isMultiDepartment } = useUserEnrolledUnits(
    member,
    activeWorkspaceId,
    tasks
  )

  const activeUnit = useMemo(() => {
    if (!selectedUnit) return null
    return userUnits.find((u) => u.id === selectedUnit.id) ?? selectedUnit
  }, [selectedUnit, userUnits])

  const orderedTasks = useMemo(() => orderDayTasks(tasks), [tasks])

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
            <a
              href={`/workspace/${activeWorkspaceId}/tasks`}
              className="inline-flex h-7 items-center gap-1 rounded px-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ListTodo size={12} />
              All Tasks
            </a>
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

          <MyDaySummary tasks={tasks} />

          {isMultiDepartment ? (
            <MyDepartmentGrid
              units={userUnits}
              onSelectUnit={setSelectedUnit}
            />
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