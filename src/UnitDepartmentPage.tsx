import { useState, useMemo } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { CheckSquare, Users, GitFork, ArrowLeft } from 'lucide-react'
import { useWorkspace } from './context/useWorkspace'
import { useWorkspaceUnits, useUnitMembers } from './hooks/useOrganizationUnits'
import { useWorkspaceRoster } from './hooks/useWorkspaceRoster'
import { useWorkspaceTasks } from './hooks/useWorkspaceTasks'
import AppNavbar from './components/layout/AppNavbar'
import { UnitDepartmentHeader } from './components/unit-view/UnitDepartmentHeader'
import TaskModal from './components/tasks/TaskModal'
import { AssignMemberModal } from './components/settings/AssignMemberModal'
import { getUnitBreadcrumb } from './utils/orgUnitTree'
import { Button } from './components/ui'
import type { CreateTaskInput } from './types/tasks'

export type UnitDepartmentTab = 'tasks' | 'staff' | 'subunits'

export default function UnitDepartmentPage() {
  const { workspaceId: paramWsId, unitId } = useParams<{ workspaceId?: string; unitId: string }>()
  const { currentWorkspace, accentColor } = useWorkspace()
  const activeWorkspaceId = paramWsId || currentWorkspace?.id || ''

  const { units, isLoading: unitsLoading } = useWorkspaceUnits(activeWorkspaceId)
  const { data: members = [], refetch: refetchMembers } = useUnitMembers(unitId)
  const { roster } = useWorkspaceRoster(activeWorkspaceId)
  const { tasks, createBatch } = useWorkspaceTasks(activeWorkspaceId, { unit: unitId })

  const [activeTab, setActiveTab] = useState<UnitDepartmentTab>('tasks')
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)

  const currentUnit = useMemo(() => {
    return units.find((u) => u.id === unitId) ?? null
  }, [units, unitId])

  const headMemberId = currentUnit?.headMemberId
  const headMember = useMemo(() => {
    if (!headMemberId) return null
    return roster.find((m) => m.memberId === headMemberId) ?? null
  }, [roster, headMemberId])

  const breadcrumbs = useMemo(() => {
    if (!currentUnit) return []
    return getUnitBreadcrumb(units, currentUnit)
  }, [units, currentUnit])

  const childUnits = useMemo(() => {
    if (!unitId) return []
    return units.filter((u) => u.parentId === unitId)
  }, [units, unitId])

  if (!unitId) {
    return <Navigate to={`/workspace/${activeWorkspaceId}/settings/organization`} replace />
  }

  const handleCreateTasks = async (newTasks: CreateTaskInput[]) => {
    await createBatch(newTasks)
    setIsTaskModalOpen(false)
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
        <>
          <UnitDepartmentHeader
            unit={currentUnit}
            breadcrumbs={breadcrumbs}
            workspaceId={activeWorkspaceId}
            headName={headMember?.name}
            onAssignTask={() => setIsTaskModalOpen(true)}
            onAddStaff={() => setIsStaffModalOpen(true)}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
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
                <span>Tasks ({tasks.length})</span>
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

            {/* Tab Body Placeholder (Connected in Phases 3 & 4) */}
            <div id="unit-tab-content">
              {activeTab === 'tasks' && (
                <div className="bg-white rounded-xl border border-zinc-200 p-6 text-sm text-zinc-500">
                  Tasks feed container ({tasks.length} tasks scoped to {currentUnit.name})
                </div>
              )}
              {activeTab === 'staff' && (
                <div className="bg-white rounded-xl border border-zinc-200 p-6 text-sm text-zinc-500">
                  Staff roster container ({members.length} members appointed to {currentUnit.name})
                </div>
              )}
              {activeTab === 'subunits' && (
                <div className="bg-white rounded-xl border border-zinc-200 p-6 text-sm text-zinc-500">
                  Sub-departments container ({childUnits.length} child units)
                </div>
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
        </>
      )}
    </div>
  )
}
