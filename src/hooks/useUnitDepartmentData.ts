import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useWorkspace } from '../context/useWorkspace'
import { useAuth } from '../context/useAuth'
import { useWorkspaceUnits, useUnitMembers } from './useOrganizationUnits'
import { useWorkspaceRoster } from './useWorkspaceRoster'
import { useWorkspaceTasks } from './useWorkspaceTasks'
import { getUnitBreadcrumb } from '../utils/orgUnitTree'
import { filterTasksByUnit } from '../utils/taskUnitScoping'

/**
 * Aggregates every server-state slice the Unit Department (HOD) page needs:
 * the unit hierarchy, the unit's member roster, the workspace roster and the
 * department-scoped task feed - plus all derived breadcrumbs / child units /
 * head-member lookups, memoized. The page component stays a thin view shell.
 */
export function useUnitDepartmentData() {
  const { workspaceId: paramWsId, unitId } = useParams<{ workspaceId?: string; unitId: string }>()
  const { currentWorkspace } = useWorkspace()
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
    approveTask,
    approveError,
    isApproving,
  } = useWorkspaceTasks(activeWorkspaceId, { unit: unitId })

  const [includeSubtree, setIncludeSubtree] = useState(true)

  const currentUnit = useMemo(() => units.find((u) => u.id === unitId) ?? null, [units, unitId])
  const headMemberId = currentUnit?.headMemberId
  const headMember = useMemo(
    () => (headMemberId ? roster.find((m) => m.memberId === headMemberId) ?? null : null),
    [roster, headMemberId]
  )
  const breadcrumbs = useMemo(
    () => (currentUnit ? getUnitBreadcrumb(units, currentUnit) : []),
    [units, currentUnit]
  )
  const childUnits = useMemo(
    () => (unitId ? units.filter((u) => u.parentId === unitId) : []),
    [units, unitId]
  )
  const scopedTasks = useMemo(
    () => filterTasksByUnit(tasks, unitId || '', units, roster, includeSubtree),
    [tasks, unitId, units, roster, includeSubtree]
  )

  const scopedMemberIds = useMemo(() => {
    if (!unitId) return []
    const ids = new Set<string>()

    // 1. Members directly belonging to this unit from useUnitMembers
    members.forEach((m) => {
      if (m.memberId) ids.add(m.memberId)
      if (m.userId) ids.add(m.userId)
    })

    // 2. If includeSubtree is true, also include members of descendant units
    if (includeSubtree && childUnits.length > 0) {
      const subtreeUnitIds = new Set(
        units.filter((u) => u.id === unitId || u.ancestorIds.includes(unitId)).map((u) => u.id)
      )
      roster.forEach((m) => {
        const belongsToSubtree =
          (m.unitId && subtreeUnitIds.has(m.unitId)) ||
          m.unitIds?.some((uid) => subtreeUnitIds.has(uid))
        if (belongsToSubtree) {
          if (m.memberId) ids.add(m.memberId)
          if (m.userId) ids.add(m.userId)
        }
      })
    }

    return Array.from(ids)
  }, [unitId, members, includeSubtree, childUnits.length, units, roster])

  return {
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
    scopedMemberIds,
    members,
    membersLoading,
    refetchMembers,
    roster,
    createBatch,
    approveTask,
    approveError,
    isApproving,
    removeAssignment,
    isRemovingMember,
    includeSubtree,
    setIncludeSubtree,
  }
}
