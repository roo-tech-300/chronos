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
  if (mode === 'direct') {
    return new Set(roster.filter((m) => m.unitId === scopeUnitId).map((m) => m.memberId))
  }
  const subtreeIds = new Set(collectSubtreeIds(units, scopeUnitId))
  return new Set(
    roster.filter((m) => m.unitId && subtreeIds.has(m.unitId)).map((m) => m.memberId),
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
    const unitRoster = roster.filter((m) => m.unitId && subtreeIds.has(m.unitId))
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