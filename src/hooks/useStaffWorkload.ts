import { useMemo } from 'react'
import type { TaskItem } from '../types/tasks'
import type { UnitMemberItem } from '../services/unitMembersService'

export interface MemberWorkload {
  total: number
  approved: number
  submitted: number
  open: number
}

/**
 * Derives per-member task workload counts and applies the roster search
 * filter. Extracted from UnitStaffTab to keep it a pure presentation shell.
 */
export function useStaffWorkload(
  members: UnitMemberItem[],
  tasks: TaskItem[],
  searchQuery: string
) {
  const memberTasksMap = useMemo(() => {
    const map = new Map<string, MemberWorkload>()
    for (const t of tasks) {
      if (!t.assigneeMemberId) continue
      const current = map.get(t.assigneeMemberId) ?? { total: 0, approved: 0, submitted: 0, open: 0 }
      current.total += 1
      if (t.status === 'approved') current.approved += 1
      else if (t.status === 'submitted') current.submitted += 1
      else current.open += 1
      map.set(t.assigneeMemberId, current)
    }
    return map
  }, [tasks])

  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return members
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.jobTitle && m.jobTitle.toLowerCase().includes(q)) ||
        m.roleLabel.toLowerCase().includes(q)
    )
  }, [members, searchQuery])

  return { memberTasksMap, filteredMembers }
}
