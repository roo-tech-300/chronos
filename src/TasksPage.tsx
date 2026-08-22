import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import AppNavbar from './components/layout/AppNavbar'
import { initialTasks, type TaskItem, type StaffTaskGroup } from './dummy/tasks-mock'
import { useDevPersona } from './context/DevPersonaContext'
import { Button, Toolbar } from './components/ui'
import StaffTaskAccordion from './components/tasks/StaffTaskAccordion'
import TaskModal from './components/tasks/TaskModal'
import TaskDetailsModal from './components/tasks/TaskDetailsModal'

const taskFilterTabs = [
  "Today's Tasks",
  'Submitted (Waiting Approval)',
  'Approved',
  'Not Done',
  'All Tasks',
] as const

export default function TasksPage() {
  const { currentDepartment } = useDevPersona()
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks)
  const [activeTab, setActiveTab] = useState<string>("Today's Tasks")
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)

  // Filter tasks according to activeTab & searchQuery
  const staffGroups = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const matchSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assigneeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.subDepartment.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchSearch) return false

      if (activeTab === "Today's Tasks") return task.isToday !== false
      if (activeTab === 'Submitted (Waiting Approval)') return task.status === 'submitted'
      if (activeTab === 'Approved') return task.status === 'approved'
      if (activeTab === 'Not Done') return task.status === 'not_done'
      return true
    })

    const map = new Map<string, StaffTaskGroup>()

    const knownStaff = [
      { name: 'Marcus Vance', role: 'Senior Hardware Tech', subDepartment: 'Neural Hardware' },
      { name: 'Elena Rostova', role: 'Infrastructure Engineer', subDepartment: 'Edge Compute' },
      { name: 'Devon Miles', role: 'Security Systems Analyst', subDepartment: 'Autonomous Systems' },
      { name: 'Sarah Jenkins', role: 'Lab Operations Manager', subDepartment: 'Autonomous Systems' },
    ]

    knownStaff.forEach((s) => {
      map.set(s.name, {
        name: s.name,
        role: s.role,
        subDepartment: s.subDepartment,
        initials: s.name.split(' ').map((n) => n[0]).join(''),
        tasks: [],
      })
    })

    filtered.forEach((task) => {
      if (!map.has(task.assigneeName)) {
        map.set(task.assigneeName, {
          name: task.assigneeName,
          role: task.assigneeRole,
          subDepartment: task.subDepartment,
          initials: task.assigneeName.split(' ').map((n) => n[0]).join(''),
          tasks: [],
        })
      }
      map.get(task.assigneeName)!.tasks.push(task)
    })

    return Array.from(map.values())
  }, [tasks, activeTab, searchQuery])

  // Counts for summary counters
  const totalApproved = useMemo(() => tasks.filter((t) => t.status === 'approved').length, [tasks])
  const totalSubmitted = useMemo(() => tasks.filter((t) => t.status === 'submitted').length, [tasks])
  const totalNotDone = useMemo(() => tasks.filter((t) => t.status === 'not_done').length, [tasks])

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
          ? { ...t, status: 'approved', completedAt: 'Just now by HOD' }
          : t
      )
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans pt-16">
      <AppNavbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                Departmental Tasks
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-200/80 font-semibold text-zinc-800">
                {currentDepartment.name}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Review deliverables across 3 states: Approved ({totalApproved}), Submitted for Approval ({totalSubmitted}), and Not Done ({totalNotDone}).
            </p>
          </div>

          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsCreateOpen(true)}
          >
            Assign New Task
          </Button>
        </div>

        <Toolbar
          className="mb-6"
          search={{
            placeholder: 'Search staff or tasks...',
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            onClear: () => setSearchQuery(''),
            width: 'w-full sm:w-72',
          }}
          tabs={{
            tabs: taskFilterTabs.map((t) => ({
              id: t,
              label:
                t === 'Submitted (Waiting Approval)' && totalSubmitted > 0
                  ? `Submitted (${totalSubmitted})`
                  : t,
            })),
            activeTab,
            onChange: setActiveTab,
            variant: 'pill',
          }}
        />

        {/* Staff-sorted Accordions */}
        <div className="space-y-4">
          {staffGroups.map((group, idx) => (
            <StaffTaskAccordion
              key={group.name}
              name={group.name}
              role={group.role}
              subDepartment={group.subDepartment}
              tasks={group.tasks}
              defaultOpen={idx === 0}
              onApproveTask={handleApproveTask}
              onViewDetails={setSelectedTask}
            />
          ))}
        </div>
      </main>

      <TaskModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateBatch={handleCreateBatch}
        subDepartments={currentDepartment.subDepartments}
      />

      <TaskDetailsModal
        open={Boolean(selectedTask)}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onApprove={handleApproveTask}
      />
    </div>
  )
}
