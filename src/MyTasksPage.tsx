import { useMemo, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import AppNavbar from './components/layout/AppNavbar'
import { useDevPersona } from './context/DevPersonaContext'
import { orderDayTasks } from './dummy/myday-mock'
import { useMyDayTasks } from './hooks/useMyDayTasks'
import type { TaskItem, TaskSubmissionPayload } from './types/tasks'
import ClockInStatusCard from './components/mytasks/ClockInStatusCard'
import MyDaySummary from './components/mytasks/MyDaySummary'
import DayTaskCard from './components/mytasks/DayTaskCard'
import TaskCompletionDrawer from './components/mytasks/TaskCompletionDrawer'
import './styles/tasks-layout.css'
import './styles/tasks-widgets.css'
import './styles/tasks-day.css'

export default function MyTasksPage() {
  const { currentDepartment, currentStaff } = useDevPersona()
  const { tasks, submitCompletion } = useMyDayTasks(currentStaff.name)
  const [drawerTask, setDrawerTask] = useState<TaskItem | null>(null)

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
              <h1>My Tasks — Daily Workspace</h1>
              <p>
                Arrival &amp; daily focus for {currentStaff.name} · {currentDepartment.name}. Tasks
                are ordered by priority, then estimated duration.
              </p>
            </div>
            <span className="tasks-badge">
              <CalendarDays size={13} /> {todayLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <ClockInStatusCard
            name={currentStaff.name}
            role={currentStaff.role}
            subDepartment={currentStaff.subDepartment}
            initials={currentStaff.initials}
            clockInTime={currentStaff.clockInTime}
          />

          <MyDaySummary tasks={tasks} />

          {orderedTasks.length === 0 ? (
            <div className="tasks-empty-card">
              No tasks are scheduled for today. You are all caught up.
            </div>
          ) : (
            <section className="tasks-day-grid">
              {orderedTasks.map((task) => (
                <DayTaskCard
                  key={task.id}
                  task={task}
                  hodName={currentDepartment.lead}
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

      <TaskCompletionDrawer
        open={Boolean(drawerTask)}
        task={drawerTask}
        onClose={() => setDrawerTask(null)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}