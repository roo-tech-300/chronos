import type { StaffTaskGroup, TaskItem, WorkspaceMemberRecord } from '../types/tasks'

/** Exact filter surfaces provided by the review toolbar. */
export const TASK_FILTER_TABS = [
  "Today's Tasks",
  'Submitted (Waiting Approval)',
  'Approved',
  'Not Done',
  'All Tasks',
] as const

export type TasksFilterTab = (typeof TASK_FILTER_TABS)[number]

/** Aggregated lifecycle counters for a person or a whole unit. */
export interface StatusSummary {
  approved: number
  submitted: number
  notDone: number
}

function matchesSearch(task: TaskItem, searchQuery: string): boolean {
  if (!searchQuery.trim()) return true
  const query = searchQuery.toLowerCase()
  return (
    task.title.toLowerCase().includes(query) ||
    task.assigneeName.toLowerCase().includes(query) ||
    task.subDepartment.toLowerCase().includes(query)
  )
}

export function taskMatchesTab(task: TaskItem, tab: TasksFilterTab): boolean {
  switch (tab) {
    case "Today's Tasks":
      return task.isToday !== false
    case 'Submitted (Waiting Approval)':
      return task.status === 'submitted'
    case 'Approved':
      return task.status === 'approved'
    case 'Not Done':
      return task.status === 'not_done'
    default:
      return true
  }
}

/** Applies the active toolbar filter (status tab + free-text search). */
export function filterReviewTasks(
  tasks: TaskItem[],
  tab: TasksFilterTab,
  searchQuery: string,
): TaskItem[] {
  return tasks.filter((task) => taskMatchesTab(task, tab) && matchesSearch(task, searchQuery))
}

/** Compact 2-letter initials from a display name (e.g. "Sarah Jenkins" -> "SJ"). */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

export function summarizeStatuses(tasks: TaskItem[]): StatusSummary {
  const summary: StatusSummary = { approved: 0, submitted: 0, notDone: 0 }
  for (const task of tasks) {
    if (task.status === 'approved') summary.approved += 1
    else if (task.status === 'submitted') summary.submitted += 1
    else if (task.status === 'not_done') summary.notDone += 1
  }
  return summary
}

/**
 * Groups tasks per staff member, seeded from the live workspace roster so team
 * members without tasks still surface for review. Leads are listed first,
 * followed alphabetically by name.
 */
export function buildStaffGroups(
  filteredTasks: TaskItem[],
  directory: readonly WorkspaceMemberRecord[],
): StaffTaskGroup[] {
  const map = new Map<string, StaffTaskGroup>()

  for (const entry of directory) {
    if (!map.has(entry.name)) {
      map.set(entry.name, {
        name: entry.name,
        role: entry.roleLabel,
        subDepartment: entry.department,
        initials: getInitials(entry.name),
        isLead: entry.role === 'hod' || entry.role === 'owner' || entry.role === 'admin',
        tasks: [],
      })
    }
  }

  for (const task of filteredTasks) {
    const existing = map.get(task.assigneeName)
    if (existing) {
      existing.tasks.push(task)
    } else {
      map.set(task.assigneeName, {
        name: task.assigneeName,
        role: task.assigneeRole,
        subDepartment: task.subDepartment,
        initials: getInitials(task.assigneeName),
        tasks: [],
      })
      map.get(task.assigneeName)!.tasks.push(task)
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const leadDiff = Number(Boolean(b.isLead)) - Number(Boolean(a.isLead))
    return leadDiff !== 0 ? leadDiff : a.name.localeCompare(b.name)
  })
}