import { useQuery } from '@tanstack/react-query'
import { fetchWorkspaceRoster } from '../services/currentMemberService'

/**
 * Live staff roster for a workspace, fetched straight from the database.
 * No mock seeding: an empty roster means the workspace truly has no members.
 */
export function useWorkspaceRoster(workspaceId: string) {
  const {
    data,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['workspace-roster', workspaceId],
    queryFn: () => fetchWorkspaceRoster(workspaceId),
    enabled: Boolean(workspaceId),
    staleTime: 1000 * 60 * 2, // 2 min fresh cache protects the backend
  })

  return {
    roster: data ?? [],
    isLoading,
    isFetching,
  }
}