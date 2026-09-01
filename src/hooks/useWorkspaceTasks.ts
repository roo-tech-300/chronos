import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchWorkspaceTasks,
  createTaskBatch,
  approveTask,
} from '../services/taskService'
import type { TaskItem, TaskFilters, CreateTaskInput } from '../types/tasks'

export function useWorkspaceTasks(workspaceId: string, filters?: TaskFilters) {
  const queryClient = useQueryClient()
  const queryKey = ['workspace-tasks', workspaceId, filters]

  const {
    data: tasks = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchWorkspaceTasks(workspaceId, filters),
    enabled: Boolean(workspaceId),
    staleTime: 1000 * 30, // 30s fresh cache
    refetchInterval: 1000 * 60, // Background poll every 60s
  })

  const createBatchMutation = useMutation({
    mutationFn: (newTasks: CreateTaskInput[]) => createTaskBatch(workspaceId, newTasks),
    onSuccess: (result) => {
      if (result.success && result.data) {
        queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] })
      }
    },
  })

  const approveTaskMutation = useMutation({
    mutationFn: ({ taskId, verifiedBy }: { taskId: string; verifiedBy: string }) =>
      approveTask(taskId, verifiedBy),
    onMutate: async ({ taskId, verifiedBy }) => {
      await queryClient.cancelQueries({ queryKey: ['workspace-tasks', workspaceId] })
      const previousTasks = queryClient.getQueryData<TaskItem[]>(queryKey)

      if (previousTasks) {
        queryClient.setQueryData<TaskItem[]>(
          queryKey,
          previousTasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'approved',
                  verifiedBy,
                  completedAt: t.completedAt || new Date().toISOString(),
                }
              : t
          )
        )
      }
      return { previousTasks }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] })
    },
  })

  return {
    tasks,
    isLoading,
    isFetching,
    error: error instanceof Error ? error.message : null,
    refetch,
    createBatch: createBatchMutation.mutateAsync,
    isCreating: createBatchMutation.isPending,
    approveTask: approveTaskMutation.mutateAsync,
    isApproving: approveTaskMutation.isPending,
  }
}
