import { useState, useMemo } from 'react'
import { useWorkspaceRoster } from './useWorkspaceRoster'
import { useWorkspaceUnits } from './useOrganizationUnits'
import { useDevPersona } from '../context/DevPersonaContext'
import { collectSubtreeIds } from '../utils/orgUnitTree'
import type { OrgUnit } from '../types/organization'
import type { StaffOption } from '../components/tasks/TaskStaffSelector'

interface UseTaskAssigneeScopeOptions {
  workspaceId: string
  initialUnitId?: string
  initialUnitName?: string
  allowedMemberIds?: string[]
  allowUnitChange?: boolean
}

export function useTaskAssigneeScope({
  workspaceId,
  initialUnitId,
  initialUnitName,
  allowedMemberIds,
  allowUnitChange = true,
}: UseTaskAssigneeScopeOptions) {
  const { role, currentDepartment } = useDevPersona()
  const { roster, isLoading: isRosterLoading } = useWorkspaceRoster(workspaceId)
  const { units, isLoading: isUnitsLoading } = useWorkspaceUnits(workspaceId)

  // 1. Resolve available units based on dev persona role
  const availableUnits = useMemo(() => {
    if (role === 'hod') {
      return units.filter(
        (u) =>
          u.name.toLowerCase() === currentDepartment.name.toLowerCase() ||
          currentDepartment.subDepartments.some(
            (sd) => sd.toLowerCase() === u.name.toLowerCase()
          )
      )
    }
    return units
  }, [units, role, currentDepartment])

  // 2. Resolve selected unit ID without cascading effect renders
  const [customUnitId, setCustomUnitId] = useState<string | null>(null)
  const selectedUnitId = initialUnitId || customUnitId || (availableUnits[0]?.id ?? '')

  const selectedUnit = useMemo<OrgUnit | null>(() => {
    return units.find((u) => u.id === selectedUnitId) || null
  }, [units, selectedUnitId])

  const effectiveUnitName = useMemo(() => {
    return initialUnitName || selectedUnit?.name || currentDepartment.name || 'Organization Unit'
  }, [initialUnitName, selectedUnit, currentDepartment.name])

  // 3. Compute eligible member IDs strictly scoped to the unit
  const eligibleMemberIds = useMemo<Set<string>>(() => {
    if (allowedMemberIds && allowedMemberIds.length > 0) {
      return new Set(allowedMemberIds)
    }

    if (!selectedUnitId) return new Set()

    const targetUnit = units.find((u) => u.id === selectedUnitId)
    const subtreeIds = new Set(collectSubtreeIds(units, selectedUnitId))
    const subtreeNames = new Set(
      units.filter((u) => subtreeIds.has(u.id)).map((u) => u.name.toLowerCase())
    )

    const eligible = new Set<string>()
    roster.forEach((m) => {
      const belongs =
        m.unitId === selectedUnitId ||
        m.unitIds?.includes(selectedUnitId) ||
        (m.unitId && subtreeIds.has(m.unitId)) ||
        m.unitIds?.some((uid) => subtreeIds.has(uid)) ||
        (targetUnit && m.department && m.department.toLowerCase() === targetUnit.name.toLowerCase()) ||
        (m.department && subtreeNames.has(m.department.toLowerCase()))

      if (belongs) {
        eligible.add(m.memberId)
      }
    })

    return eligible
  }, [allowedMemberIds, selectedUnitId, units, roster])

  // 4. Staff list filtered EXCLUSIVELY to members on this unit
  const staffList = useMemo<StaffOption[]>(() => {
    return roster
      .filter((m) => eligibleMemberIds.has(m.memberId))
      .map((m) => ({
        id: m.memberId,
        name: m.name,
        role: m.roleLabel,
        subDepartment: m.department || effectiveUnitName,
      }))
  }, [roster, eligibleMemberIds, effectiveUnitName])

  // 5. Selected staff management
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])

  const activeSelectedIds = useMemo(() => {
    const valid = selectedStaffIds.filter((id) => staffList.some((s) => s.id === id))
    if (valid.length > 0) return valid
    return staffList[0]?.id ? [staffList[0].id] : []
  }, [selectedStaffIds, staffList])

  const isAllSelected = staffList.length > 0 && activeSelectedIds.length === staffList.length

  function toggleStaff(id: string) {
    if (!eligibleMemberIds.has(id)) return // Prevent selecting unauthorized member

    setSelectedStaffIds((prev) => {
      const current = prev.filter((p) => staffList.some((s) => s.id === p))
      const fallbackId = staffList[0]?.id || ''
      const effectiveCurrent = current.length > 0 ? current : (fallbackId ? [fallbackId] : [])

      return effectiveCurrent.includes(id)
        ? effectiveCurrent.length > 1
          ? effectiveCurrent.filter((item) => item !== id)
          : effectiveCurrent
        : [...effectiveCurrent, id]
    })
  }

  function toggleAllStaff() {
    if (activeSelectedIds.length === staffList.length) {
      const fallbackId = staffList[0]?.id
      setSelectedStaffIds(fallbackId ? [fallbackId] : [])
    } else {
      setSelectedStaffIds(staffList.map((s) => s.id))
    }
  }

  function validateAssignees(): { valid: boolean; error?: string } {
    if (!selectedUnitId && availableUnits.length > 0) {
      return { valid: false, error: 'Please choose an organization unit before assigning tasks.' }
    }
    if (staffList.length === 0) {
      return {
        valid: false,
        error: `No staff members are enrolled in ${effectiveUnitName}. Tasks can only be assigned to personnel within this unit.`,
      }
    }
    if (activeSelectedIds.length === 0) {
      return { valid: false, error: 'Please select at least one staff member to receive this task.' }
    }
    const foreignMember = activeSelectedIds.find((id) => !eligibleMemberIds.has(id))
    if (foreignMember) {
      return {
        valid: false,
        error: 'Cannot assign task: selected staff member does not belong to this unit.',
      }
    }
    return { valid: true }
  }

  return {
    availableUnits,
    selectedUnitId,
    setSelectedUnitId: (id: string) => setCustomUnitId(id),
    selectedUnit,
    effectiveUnitName,
    staffList,
    activeSelectedIds,
    setSelectedStaffIds,
    toggleStaff,
    toggleAllStaff,
    isAllSelected,
    validateAssignees,
    isLoading: isRosterLoading || isUnitsLoading,
    canChangeUnit: allowUnitChange && !initialUnitId && availableUnits.length > 1,
  }
}
