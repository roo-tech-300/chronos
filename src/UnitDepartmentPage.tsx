import { useState, useMemo } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { CheckSquare, Users, GitFork, ArrowLeft, AlertCircle } from 'lucide-react'
import { useWorkspace } from './context/useWorkspace'
import { useAuth } from './context/useAuth'
import { useWorkspaceUnits, useUnitMembers } from './hooks/useOrganizationUnits'
import { useWorkspaceRoster } from './hooks/useWorkspaceRoster'
import { useWorkspaceTasks } from './hooks/useWorkspaceTasks'
import AppNavbar from './components/layout/AppNavbar'
import { UnitDepartmentHeader } from './components/unit-view/UnitDepartmentHeader'
import { UnitMetricsBar } from './components/unit-view/UnitMetricsBar'
import { UnitStaffTab } from './components/unit-view/UnitStaffTab'
import { UnitTasksTab } from './components/unit-view/UnitTasksTab'
import { UnitSubDepartmentsTab } from './components/unit-view/UnitSubDepartmentsTab'
import TaskModal from './components/tasks/TaskModal'
import { AssignMemberModal } from './components/settings/AssignMemberModal'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { getUnitBreadcrumb } from './utils/orgUnitTree'
import { filterTasksByUnit } from './utils/taskUnitScoping'
import { Button } from './components/ui'
import type { CreateTaskInput, TaskItem } from './types/tasks'

export type UnitDepartmentTab = 'tasks' | 'staff' | 'subunits'

export default function UnitDepartmentPage() {
  const { workspaceId: paramWsId, unitId } = useParams<{ workspaceId?: string; unitId: string }>()
  const { currentWorkspace, accentColor } = useWorkspace()
  const { profile } = useAuth()
  const activeWorkspaceId = paramWsId || currentWorkspace?.id || ''

  const { units, isLoading: unitsLoading, removeAssignment, isRemoving: isRemovingMember } =
    useWorkspaceUnits(activeWorkspaceId)
  const { data: members = [], isLoading: membersLoading, refetch: refetchMembers } =
    useUnitMembers(unitId)
  const { roster } = useWorkspaceRoster(activeWorkspaceId)
  const {
    tasks,
    createBatch,
    approveTask: approveTaskMutation,
    approveError,
    isApproving,
  } = useWorkspaceTasks(activeWorkspaceId, { unit: unitId })

  const [activeTab, setActiveTab] = useState<UnitDepartmentTab>('tasks')
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
  const [includeSubtree, setIncludeSubtree] = useState(true)
  const [createError, setCreateError] = useState<string | null>(null)

  const currentUnit = useMemo(() => units.find((u) => u.id === unitId) ?? null, [units, unitId])
  const headMemberId = currentUnit?.headMemberId
  const headMember = useMemo(
    () => (headMemberId ? roster.find((m) => m.memberId === headMemberId) ?? null : null),
    [roster, headMemberId]
  )
  const breadcrumbs = useMemo(() => (currentUnit ? getUnitBreadcrumb(units, currentUnit) : []), [units, currentUnit])
  const childUnits = useMemo(() => (unitId ? units.filter((u) => u.parentId === unitId) : []), [units, unitId])
  const scopedTasks = useMemo(
    () => filterTasksByUnit(tasks, unitId || '', units, roster, includeSubtree),
    [tasks, unitId, units, roster, includeSubtree]
  )

  if (!unitId) return <Navigate to={`/workspace/${activeWorkspaceId}/settings/organization`} replace />

  const handleCreateTasks = async (newTasks: CreateTaskInput[]) => {
    setCreateError(null)
    try {
      await createBatch(newTasks)
      setIsTaskModalOpen(false)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create tasks. Please try again.')
    }
  }

  const handleApproveTask = async (taskToApprove: TaskItem) => {
    await approveTaskMutation({ taskId: taskToApprove.id, verifiedBy: profile?.fullName || '' })
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!unitId) return
    await removeAssignment({ memberId, unitId })
    await refetchMembers()
  }

  return (
    <div
      className="min-h-screen bg-zinc-50 flex flex-col"
      style={{ '--workspace-accent': accentColor } as React.CSSProperties}
    >
      <AppNavbar />

      {unitsLoading ? (
        <div className="flex-1 flex items-center justify-center py-24 text-zinc-500 text-sm">
          Loading department workspace...
        </div>
      ) : !currentUnit ? (
        <div className="flex-1 flex flex-col items-center justify-center py-24 text-center px-4">
          <p className="text-zinc-600 font-medium">Department or Organization Unit not found.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            leftIcon={<ArrowLeft size={14} />}
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      ) : (
        <ErrorBoundary>
          {createError && (
            <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle size={15} className="shrink-0" />
                <span>{createError}</span>
                <button
                  type="button"
                  onClick={() => setCreateError(null)}
                  className="ml-auto font-semibold hover:text-rose-900 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
          <UnitDepartmentHeader
            unit={currentUnit}
            breadcrumbs={breadcrumbs}
            workspaceId={activeWorkspaceId}
            headName={headMember?.name}
            onAssignTask={() => setIsTaskModalOpen(true)}
            onAddStaff={() => setIsStaffModalOpen(true)}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
            {/* Scoped KPI Bar */}
            <UnitMetricsBar memberCount={members.length} tasks={scopedTasks} />

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-zinc-200 mb-6 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'tasks'
                    ? 'border-[#7c007e] text-[#7c007e]'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <CheckSquare size={16} />
                <span>Tasks ({scopedTasks.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('staff')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'staff'
                    ? 'border-[#7c007e] text-[#7c007e]'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <Users size={16} />
                <span>Staff Roster ({members.length})</span>
              </button>

              {childUnits.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('subunits')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'subunits'
                      ? 'border-[#7c007e] text-[#7c007e]'
                      : 'border-transparent text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <GitFork size={16} />
                  <span>Sub-Departments ({childUnits.length})</span>
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div id="unit-tab-content">
              {activeTab === 'tasks' && (
                <UnitTasksTab
                  tasks={scopedTasks}
                  unit={currentUnit}
                  onAssignTask={() => setIsTaskModalOpen(true)}
                  onApproveTask={handleApproveTask}
                  approveError={approveError}
                  isApproving={isApproving}
                  hasSubUnits={childUnits.length > 0}
                  includeSubtree={includeSubtree}
                  onToggleSubtree={setIncludeSubtree}
                />
              )}
              {activeTab === 'staff' && (
                <UnitStaffTab
                  members={members}
                  isLoading={membersLoading}
                  workspaceId={activeWorkspaceId}
                  unit={currentUnit}
                  tasks={scopedTasks}
                  onAddStaff={() => setIsStaffModalOpen(true)}
                  onRemoveMember={handleRemoveMember}
                  isRemoving={isRemovingMember}
                />
              )}
              {activeTab === 'subunits' && (
                <UnitSubDepartmentsTab
                  childUnits={childUnits}
                  workspaceId={activeWorkspaceId}
                  allUnits={units}
                  roster={roster}
                />
              )}
            </div>
          </main>

          <TaskModal
            open={isTaskModalOpen}
            onClose={() => setIsTaskModalOpen(false)}
            onCreateBatch={handleCreateTasks}
            workspaceId={activeWorkspaceId}
            departmentName={currentUnit.name}
          />

          <AssignMemberModal
            isOpen={isStaffModalOpen}
            unit={currentUnit}
            workspaceId={activeWorkspaceId}
            onClose={() => setIsStaffModalOpen(false)}
            onSuccess={() => refetchMembers()}
          />
        </ErrorBoundary>
      )}
    </div>
  )
}
