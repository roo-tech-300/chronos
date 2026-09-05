import { useState, useMemo } from 'react'
import type { TaskItem } from '../types/tasks'

export type TaskStatusFilter = 'all' | 'submitted' | 'approved' | 'not_done'

/**
 * Status-filter + search pipeline for the department task feed.
 * Owns the raw filter state so UnitTasksTab stays a pure presentation shell.
 */
export function useTaskFilters(tasks: TaskItem[]) {
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const counts = useMemo(
    () => ({
      all: tasks.length,
      submitted: tasks.filter((t) => t.status === 'submitted').length,
      approved: tasks.filter((t) => t.status === 'approved').length,
      not_done: tasks.filter((t) => t.status === 'not_done').length,
    }),
    [tasks]
  )

  const filteredTasks = useMemo(
    () =>
      tasks.filter((t) => {
        if (statusFilter !== 'all' && t.status !== statusFilter) return false
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase().trim()
        return (
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.assigneeName.toLowerCase().includes(q)
        )
      }),
    [tasks, statusFilter, searchQuery]
  )

  return { statusFilter, setStatusFilter, searchQuery, setSearchQuery, counts, filteredTasks }
}
