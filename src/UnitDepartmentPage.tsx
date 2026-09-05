import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { useWorkspace } from './context/useWorkspace'
import { useUnitDepartmentData } from './hooks/useUnitDepartmentData'
import AppNavbar from './components/layout/AppNavbar'
import './styles/dashboard-layout.css'
import './styles/dashboard-widgets.css'
import { UnitDepartmentHeader } from './components/unit-view/UnitDepartmentHeader'
import { UnitDashboardGrid } from './components/unit-view/UnitDashboardGrid'
import { UnitStaffTab } from './components/unit-view/UnitStaffTab'
import { UnitTasksTab } from './components/unit-view/UnitTasksTab'
import { UnitSubDepartmentsTab } from './components/unit-view/UnitSubDepartmentsTab'
import { UnitTabNav, type UnitDepartmentTab } from './components/unit-view/UnitTabNav'
import TaskModal from './components/tasks/TaskModal'
import { AssignMemberModal } from './components/settings/AssignMemberModal'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { Button } from './components/ui'
import type { CreateTaskInput, TaskItem } from './types/tasks'

export type { UnitDepartmentTab } from './components/unit-view/UnitTabNav'

export default function UnitDepartmentPage() {
  const { accentColor } = useWorkspace()
  const {
    unitId,
    activeWorkspaceId,
    profile,
    units,
    unitsLoading,
    currentUnit,
    headMember,
    breadcrumbs,
    childUnits,
    scopedTasks,
    members,
    membersLoading,
    refetchMembers,
    roster,
    createBatch,
    approveTask: approveTaskMutation,
    approveError,
    isApproving,
    removeAssignment,
    isRemovingMember,
    includeSubtree,
    setIncludeSubtree,
  } = useUnitDepartmentData()

  const [activeTab, setActiveTab] = useState<UnitDepartmentTab>('tasks')
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

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
    try {
      await approveTaskMutation({ taskId: taskToApprove.id, verifiedBy: profile?.fullName || '' })
    } catch {
      // Failure is surfaced to the user through the approveError banner rendered
      // inside UnitTasksTab (TanStack mutation error state) - never swallow silently.
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!unitId) return
    await removeAssignment({ memberId, unitId })
    await refetchMembers()
  }

  return (
    <div
      className="dash-page flex flex-col"
      style={
        {
          '--dash-primary': accentColor,
          '--workspace-accent': accentColor,
        } as React.CSSProperties
      }
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
            {/* HOD Dashboard replica: same widget grid the persona view renders */}
            <UnitDashboardGrid
              unitName={currentUnit.name}
              memberCount={members.length}
              subUnitNames={childUnits.map((u) => u.name)}
            />

            {/* Tab Navigation */}
            <UnitTabNav
              activeTab={activeTab}
              onChange={setActiveTab}
              taskCount={scopedTasks.length}
              memberCount={members.length}
              subUnitCount={childUnits.length}
            />

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
