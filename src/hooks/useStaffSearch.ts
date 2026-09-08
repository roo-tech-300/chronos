import { useQuery } from '@tanstack/react-query'
import { searchWorkspaceMembers } from '../services/currentMemberService'
import type { WorkspaceMemberRecord } from '../types/tasks'

/**
 * Debounced server-side search for workspace staff.
 * Only fires when the search term is ≥ 2 characters, with a 30-second
 * stale cache to prevent redundant refetches on rapid backspacing.
 */
export function useStaffSearch(
  workspaceId: string,
  searchTerm: string
) {
  const trimmed = searchTerm.trim()

  const {
    data: results = [],
    isLoading,
    isFetching,
    error,
  } = useQuery<WorkspaceMemberRecord[], Error>({
    queryKey: ['staff-search', workspaceId, trimmed],
    queryFn: () => searchWorkspaceMembers(workspaceId, trimmed, 20),
    enabled: Boolean(workspaceId) && trimmed.length >= 2,
    staleTime: 1000 * 30,
    gcTime: 1000 * 30,
    retry: 1,
  })

  return {
    results,
    isLoading,
    isFetching,
    error: error ? error.message : null,
  }
}