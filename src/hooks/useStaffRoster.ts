import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { fetchPaginatedStaff } from '../services/staffService'
import type { StaffQueryParams } from '../types/staff'

export function useStaffRoster(params: StaffQueryParams) {
  const { workspaceId, page, pageSize, search = '', roleTab = 'All Roles', role = 'admin' } = params

  return useQuery({
    queryKey: ['staff-roster', workspaceId, page, pageSize, search.trim(), roleTab, role],
    queryFn: () =>
      fetchPaginatedStaff({
        workspaceId,
        page,
        pageSize,
        search,
        roleTab,
        role,
      }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  })
}
