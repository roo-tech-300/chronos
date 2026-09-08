import type { OrgUnit } from '../types/organization'
import type { TaskItem, StaffTaskGroup, WorkspaceMemberRecord } from '../types/tasks'
import { buildStaffGroups, summarizeStatuses, type StatusSummary } from './taskAggregation'
import { collectSubtreeIds } from './orgUnitTree'

export type UnitScopeMode = 'subtree' | 'direct'

/**
 * Member ids visible under the selected unit scope. 'subtree' includes every
 * unit below the selected one (ltree ancestor chains), 'direct' only the unit
 * itself. Returns undefined when no scope is active (= show everything).
 */
export function resolveScopeAssigneeIds(
  units: OrgUnit[],
  roster: WorkspaceMemberRecord[],
  scopeUnitId: string | null,
  mode: UnitScopeMode,
): Set<string> | undefined {
  if (!scopeUnitId) return undefined
  const targetUnit = units.find((u) => u.id === scopeUnitId)
  if (mode === 'direct') {
    return new Set(
      roster
        .filter(
          (m) =>
            m.unitId === scopeUnitId ||
            m.unitIds?.includes(scopeUnitId) ||
            (targetUnit && m.department && m.department.toLowerCase() === targetUnit.name.toLowerCase())
        )
        .map((m) => m.memberId)
    )
  }
  const subtreeIds = new Set(collectSubtreeIds(units, scopeUnitId))
  const subtreeNames = new Set(
    units.filter((u) => subtreeIds.has(u.id)).map((u) => u.name.toLowerCase())
  )
  return new Set(
    roster
      .filter(
        (m) =>
          (m.unitId && subtreeIds.has(m.unitId)) ||
          m.unitIds?.some((uid) => subtreeIds.has(uid)) ||
          (m.department && subtreeNames.has(m.department.toLowerCase()))
      )
      .map((m) => m.memberId)
  )
}

/** Per-unit review card data: subtree roster + their filtered tasks. */
export interface UnitOverview {
  id: string
  name: string
  leadName: string | null
  memberCount: number
  groups: StaffTaskGroup[]
  summary: StatusSummary
}

export function buildUnitOverviews(
  units: OrgUnit[],
  roster: WorkspaceMemberRecord[],
  filteredTasks: TaskItem[],
): UnitOverview[] {
  return units.map((unit) => {
    const subtreeIds = new Set(collectSubtreeIds(units, unit.id))
    const subtreeNames = new Set(
      units.filter((u) => subtreeIds.has(u.id)).map((u) => u.name.toLowerCase())
    )
    const unitRoster = roster.filter(
      (m) =>
        (m.unitId && subtreeIds.has(m.unitId)) ||
        m.unitIds?.some((uid) => subtreeIds.has(uid)) ||
        (m.department && subtreeNames.has(m.department.toLowerCase()))
    )
    const memberIds = new Set(unitRoster.map((m) => m.memberId))
    const unitTasks = filteredTasks.filter((t) =>
      t.assigneeMemberId ? memberIds.has(t.assigneeMemberId) : false,
    )
    const head = unit.headMemberId
      ? roster.find((m) => m.memberId === unit.headMemberId)
      : undefined
    return {
      id: unit.id,
      name: unit.name,
      leadName: head?.name ?? null,
      memberCount: unitRoster.length,
      groups: buildStaffGroups(unitTasks, unitRoster),
      summary: summarizeStatuses(unitTasks),
    }
  })
}

/** Filters tasks belonging to a specific unit (or its subtree). */
export function filterTasksByUnit(
  tasks: TaskItem[],
  unitId: string,
  units: OrgUnit[],
  roster: WorkspaceMemberRecord[],
  includeSubtree: boolean,
): TaskItem[] {
  const current = units.find((u) => u.id === unitId)
  if (!current) return []
  const subtreeIds = new Set(includeSubtree ? collectSubtreeIds(units, unitId) : [unitId])
  const unitNames = new Set(
    units.filter((u) => subtreeIds.has(u.id)).map((u) => u.name.toLowerCase())
  )
  const assigneeIds = resolveScopeAssigneeIds(
    units,
    roster,
    unitId,
    includeSubtree ? 'subtree' : 'direct'
  )

  return tasks.filter((t) => {
    if (t.assigneeMemberId && assigneeIds?.has(t.assigneeMemberId)) return true
    if (t.department && unitNames.has(t.department.toLowerCase())) return true
    return false
  })
}
