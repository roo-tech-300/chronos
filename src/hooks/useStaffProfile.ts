import { useQuery } from '@tanstack/react-query'
import { fetchStaffProfile } from '../services/staffService'
import type { StaffProfile } from '../dummy/profile-mock'

export function useStaffProfile(staffId?: string, workspaceId?: string) {
  return useQuery<StaffProfile>({
    queryKey: ['staff-profile', staffId, workspaceId],
    queryFn: () => fetchStaffProfile(staffId || '', workspaceId),
    enabled: Boolean(staffId),
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  })
}
