import { useMemo } from 'react'
import { useWorkspaceUnits } from './useOrganizationUnits'
import { useWorkspaceRoster } from './useWorkspaceRoster'
import { collectSubtreeIds } from '../utils/orgUnitTree'
import { summarizeStatuses, type StatusSummary } from '../utils/taskAggregation'
import type { OrgUnit } from '../types/organization'
import type { TaskItem, WorkspaceMemberRecord } from '../types/tasks'

export interface UserEnrolledUnit {
  id: string
  name: string
  leadName: string | null
  memberCount: number
  tasks: TaskItem[]
  summary: StatusSummary
  unit: OrgUnit
}

/**
 * Resolves all organization units where the current workspace member is enrolled
 * (via organization_unit_members, workspace_members.unit_id, and departmental assignments),
 * scoped to the member's assigned tasks and status counts per department.
 */
export function useUserEnrolledUnits(
  member: WorkspaceMemberRecord | null,
  workspaceId: string,
  tasks: TaskItem[]
) {
  const { units, isLoading: isUnitsLoading } = useWorkspaceUnits(workspaceId)
  const { roster } = useWorkspaceRoster(workspaceId)

  const enrolledUnitIds = useMemo(() => {
    const ids = new Set<string>()
    if (member?.unitId) ids.add(member.unitId)
    if (member?.unitIds) {
      for (const uid of member.unitIds) if (uid) ids.add(uid)
    }
    if (member?.department && units.length > 0) {
      const deptLower = member.department.toLowerCase()
      const match = units.find((u) => u.name.toLowerCase() === deptLower)
      if (match) ids.add(match.id)
    }
    return ids
  }, [member, units])

  const userUnits = useMemo<UserEnrolledUnit[]>(() => {
    if (enrolledUnitIds.size === 0 || units.length === 0) return []

    return units
      .filter((u) => enrolledUnitIds.has(u.id))
      .map((unit) => {
        const subtreeIds = new Set(collectSubtreeIds(units, unit.id))
        const subtreeNames = new Set(
          units.filter((u) => subtreeIds.has(u.id)).map((u) => u.name.toLowerCase())
        )
        subtreeNames.add(unit.name.toLowerCase())

        const unitTasks = tasks.filter(
          (t) => t.department && subtreeNames.has(t.department.toLowerCase())
        )

        const head = unit.headMemberId
          ? roster.find((m) => m.memberId === unit.headMemberId)
          : null

        const unitRosterCount = roster.filter(
          (m) =>
            (m.unitId && subtreeIds.has(m.unitId)) ||
            m.unitIds?.some((uid) => subtreeIds.has(uid)) ||
            (m.department && subtreeNames.has(m.department.toLowerCase()))
        ).length

        return {
          id: unit.id,
          name: unit.name,
          leadName: head?.name ?? null,
          memberCount: unitRosterCount || 1,
          tasks: unitTasks,
          summary: summarizeStatuses(unitTasks),
          unit,
        }
      })
  }, [units, enrolledUnitIds, tasks, roster])

  return {
    userUnits,
    isMultiDepartment: userUnits.length > 1,
    isLoading: isUnitsLoading,
  }
}
