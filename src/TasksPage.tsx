import { useState, useMemo } from 'react'
import { Plus, Users, Award } from 'lucide-react'
import AppNavbar from './components/layout/AppNavbar'
import { useDevPersona } from './context/DevPersonaContext'
import { initialTasks, type StaffTaskGroup, type TaskItem } from './dummy/tasks-mock'
import { Button, Toolbar } from './components/ui'
import StaffTaskAccordion from './components/tasks/StaffTaskAccordion'
import SubDepartmentSection from './components/tasks/SubDepartmentSection'
import TaskModal from './components/tasks/TaskModal'
import TaskDetailsModal from './components/tasks/TaskDetailsModal'
import './styles/tasks-layout.css'
import './styles/tasks-widgets.css'

const taskFilterTabs = [
  "Today's Tasks",
  'Submitted (Waiting Approval)',
  'Approved',
  'Not Done',
  'All Tasks',
] as const

// Define known organizational staff hierarchy with sub-department heads vs team members
const knownStaff: Array<{
  name: string
  role: string
  subDepartment: string
  isLead?: boolean
  leadsSubDepartment?: string
}> = [
  {
    name: 'Sarah Jenkins',
    role: 'HOD Autonomous Systems & Operations',
    subDepartment: 'Autonomous Systems',
    isLead: true,
    leadsSubDepartment: 'Autonomous Systems',
  },
  {
    name: 'Elena Rostova',
    role: 'Lead Infrastructure & Edge Architect',
    subDepartment: 'Edge Compute',
    isLead: true,
    leadsSubDepartment: 'Edge Compute',
  },
  {
    name: 'Marcus Vance',
    role: 'Senior Hardware Tech',
    subDepartment: 'Neural Hardware',
    isLead: false,
  },
  {
    name: 'Devon Miles',
    role: 'Security Systems Analyst',
    subDepartment: 'Autonomous Systems',
    isLead: false,
  },
]

export default function TasksPage() {
  const { currentDepartment } = useDevPersona()
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks)
  const [activeTab, setActiveTab] = useState<string>("Today's Tasks")
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)

  // Filter tasks according to activeTab & searchQuery, then group by staff.
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

    knownStaff.forEach((s) => {
      map.set(s.name, {
        name: s.name,
        role: s.role,
        subDepartment: s.subDepartment,
        initials: s.name.split(' ').map((n) => n[0]).join(''),
        isLead: s.isLead,
        leadsSubDepartment: s.leadsSubDepartment,
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

  // Split staff into Heads of Department vs Sub-Department Team members
  const hasSubDepartments = Boolean(
    currentDepartment.subDepartments && currentDepartment.subDepartments.length > 0
  )

  const hodGroups = useMemo(() => {
    return staffGroups.filter((s) => s.isLead)
  }, [staffGroups])

  // Group non-lead staff by their sub-departments
  const subDeptSections = useMemo(() => {
    if (!hasSubDepartments) return []

    return currentDepartment.subDepartments.map((subDeptName) => {
      const lead = staffGroups.find((s) => s.isLead && (s.leadsSubDepartment === subDeptName || s.subDepartment === subDeptName))
      const members = staffGroups.filter((s) => !s.isLead && s.subDepartment === subDeptName)
      return {
        subDeptName,
        leadStaff: lead,
        teamMembers: members,
      }
    })
  }, [currentDepartment, staffGroups, hasSubDepartments])

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
          ? { ...t, status: 'approved', completedAt: 'Just now by HOD', verifiedBy: currentDepartment.lead }
          : t,
      ),
    )
  }

  const metrics = [
    { label: 'Approved', value: String(totalApproved), desc: 'Verified by HOD' },
    { label: 'Submitted', value: String(totalSubmitted), desc: 'Waiting for HOD approval' },
    { label: 'Not Done', value: String(totalNotDone), desc: 'Still open for today' },
  ]

  return (
    <div className="tasks-page">
      <AppNavbar />

      <main className="tasks-main">
        <div className="tasks-header">
          <div className="tasks-header-row">
            <div>
              <h1>Departmental Tasks</h1>
              <p>
                Review deliverables across 3 states: Approved ({totalApproved}), Submitted for
                Approval ({totalSubmitted}), and Not Done ({totalNotDone}).
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

        <div className="tasks-metrics">
          {metrics.map((m) => (
            <div key={m.label} className="tasks-metric">
              <div className="tasks-metric-top">
                <span className="tasks-metric-label">{m.label}</span>
              </div>
              <span className="tasks-metric-value">{m.value}</span>
              <span className="tasks-metric-desc">{m.desc}</span>
            </div>
          ))}
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

        {/* Hierarchical Task View: Heads of Departments first, then Sub-Department dropdowns */}
        <div className="tasks-list flex flex-col gap-6">
          {hasSubDepartments ? (
            <>
              {/* 1. Heads of Department Section at the TOP */}
              {hodGroups.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 px-1">
                    <Award size={18} className="text-purple-700" />
                    <h2 className="text-sm uppercase tracking-wider font-bold text-zinc-700">
                      Heads of Departments & Unit Leads
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">
                      Direct Reports ({hodGroups.length})
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {hodGroups.map((group, idx) => (
                      <StaffTaskAccordion
                        key={group.name}
                        name={group.name}
                        role={group.role}
                        subDepartment={group.subDepartment}
                        tasks={group.tasks}
                        isLead={true}
                        leadsSubDepartment={group.leadsSubDepartment}
                        defaultOpen={idx === 0}
                        onApproveTask={handleApproveTask}
                        onViewDetails={setSelectedTask}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Sub-Department Sections (Dropdowns for department team members) */}
              <div className="flex flex-col gap-3 mt-2">
                <div className="flex items-center gap-2 px-1">
                  <Users size={18} className="text-zinc-600" />
                  <h2 className="text-sm uppercase tracking-wider font-bold text-zinc-700">
                    Sub-Departments & Team Staff
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-700 font-semibold">
                    {subDeptSections.length} Sub-Units
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {subDeptSections.map((section) => (
                    <SubDepartmentSection
                      key={section.subDeptName}
                      subDeptName={section.subDeptName}
                      leadStaff={section.leadStaff}
                      teamMembers={section.teamMembers}
                      defaultOpen={false}
                      onApproveTask={handleApproveTask}
                      onViewDetails={setSelectedTask}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Flat layout for departments WITHOUT sub-departments */
            staffGroups.map((group, idx) => (
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
            ))
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
