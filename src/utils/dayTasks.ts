import type { TaskItem, TaskStatus } from '../types/tasks'

const STATUS_RANK: Record<TaskStatus, number> = {
  not_done: 0,
  submitted: 1,
  approved: 2,
}

// Orders a staff member's day: open work first, then alphabetically by title.
export function orderDayTasks(tasks: TaskItem[]): TaskItem[] {
  return [...tasks].sort((a, b) => {
    const byStatus = STATUS_RANK[a.status] - STATUS_RANK[b.status]
    if (byStatus !== 0) return byStatus
    return a.title.localeCompare(b.title)
  })
}