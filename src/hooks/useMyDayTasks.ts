import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchMemberTasks } from '../services/taskService'
import { submitTaskCompletion } from '../services/taskWorkflowService'
import type { TaskItem, TaskSubmissionPayload } from '../types/tasks'

export function useMyDayTasks(memberId?: string) {
  const queryClient = useQueryClient()
  const cleanId = (memberId || '').trim()
  const queryKey = ['my-day-tasks', cleanId]

  const {
    data: tasks = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchMemberTasks(cleanId, { onlyToday: true }),
    enabled: Boolean(cleanId),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 45, // Auto-refresh daily workspace every 45s
  })

  const submitCompletionMutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: TaskSubmissionPayload }) =>
      submitTaskCompletion(taskId, payload),
    onMutate: async ({ taskId, payload }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousTasks = queryClient.getQueryData<TaskItem[]>(queryKey)

      if (previousTasks) {
        queryClient.setQueryData<TaskItem[]>(
          queryKey,
          previousTasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'submitted',
                  proofNote: payload.completionNote,
                  difficultyNote: payload.difficultyNote,
                  actualMins: payload.actualMins,
                  completionLinks: payload.completionLinks || [],
                  completedAt: new Date().toISOString(),
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
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] })
    },
  })

  return {
    tasks,
    isLoading,
    isFetching,
    error: error instanceof Error ? error.message : null,
    refetch,
    submitCompletion: submitCompletionMutation.mutateAsync,
    isSubmitting: submitCompletionMutation.isPending,
  }
}
