import { initialTasks, type TaskItem, type TaskPriority } from './tasks-mock'

// Keep aligned with `devPersonaData.STAFF_PERSON` so the demo staff member's
// "Daily Workspace" is seeded from the shared departmental task records.
export const STAFF_MEMBER_NAME = 'Marcus Vance'

export const priorityRank: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

// Orders a staff member's day by priority first, then estimated duration.
export function orderDayTasks(tasks: TaskItem[]): TaskItem[] {
  return [...tasks].sort((a, b) => {
    const byPriority = priorityRank[a.priority] - priorityRank[b.priority]
    if (byPriority !== 0) return byPriority
    return (a.estimatedMins ?? 1_000_000) - (b.estimatedMins ?? 1_000_000)
  })
}

export function getTodayTasks(memberName: string = STAFF_MEMBER_NAME): TaskItem[] {
  return orderDayTasks(
    initialTasks.filter((task) => task.assigneeName === memberName && task.isToday !== false),
  )
}

export function formatMinutes(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const rest = minutes % 60
    return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
  }
  return `${minutes}m`
}