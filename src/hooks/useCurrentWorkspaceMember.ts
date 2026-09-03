import { useQuery } from '@tanstack/react-query'
import { fetchCurrentWorkspaceMember } from '../services/currentMemberService'

/**
 * Resolves the signed-in user's workspace membership (real DB record).
 * Enabled only once a real workspace id is available to avoid dead queries.
 */
export function useCurrentWorkspaceMember(workspaceId: string) {
  const {
    data,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['current-workspace-member', workspaceId],
    queryFn: () => fetchCurrentWorkspaceMember(workspaceId),
    enabled: Boolean(workspaceId),
    staleTime: 1000 * 120, // Membership rarely changes - 2 min fresh cache
  })

  return {
    member: data ?? null,
    isLoading,
    isFetching,
  }
}