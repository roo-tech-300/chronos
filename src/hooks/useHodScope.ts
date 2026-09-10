import { useMemo } from 'react'
import type { OrgUnit } from '../types/organization'
import type { WorkspaceMemberRecord } from '../types/tasks'
import { collectSubtreeIds } from '../utils/orgUnitTree'

interface UseHodScopeOptions {
  role: string | null
  departmentName: string
  subDepartments: string[]
  units: OrgUnit[]
  roster: WorkspaceMemberRecord[]
}

export function useHodScope({
  role,
  departmentName,
  subDepartments,
  units,
  roster,
}: UseHodScopeOptions) {
  const hodUnits = useMemo<OrgUnit[] | null>(() => {
    if (role !== 'hod') return null
    const deptLower = departmentName.toLowerCase()
    const subNames = new Set(subDepartments.map((s) => s.toLowerCase()))
    const roots = units.filter(
      (u) => u.name.toLowerCase() === deptLower || subNames.has(u.name.toLowerCase())
    )
    if (roots.length === 0) return null
    const ids = new Set<string>()
    for (const root of roots) {
      collectSubtreeIds(units, root.id).forEach((id) => ids.add(id))
    }
    return units.filter((u) => roots.some((r) => r.id === u.id) || ids.has(u.id))
  }, [role, departmentName, subDepartments, units])

  const hodAssigneeIds = useMemo(() => {
    if (!hodUnits) return null
    const hodUnitIds = new Set(hodUnits.map((u) => u.id))
    const subtreeNames = new Set(hodUnits.map((u) => u.name.toLowerCase()))
    return new Set(
      roster
        .filter(
          (m) =>
            (m.unitId && hodUnitIds.has(m.unitId)) ||
            m.unitIds?.some((uid) => hodUnitIds.has(uid)) ||
            (m.department && subtreeNames.has(m.department.toLowerCase()))
        )
        .map((m) => m.memberId)
    )
  }, [hodUnits, roster])

  const hodUnit = useMemo(() => {
    if (role !== 'hod') return null
    return units.find((u) => u.name.toLowerCase() === departmentName.toLowerCase()) || null
  }, [role, departmentName, units])

  return { hodUnits, hodAssigneeIds, hodUnit }
}
