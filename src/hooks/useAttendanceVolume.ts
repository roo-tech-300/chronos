import { useQuery } from '@tanstack/react-query'
import { fetchAttendanceVolume } from '../services/attendanceVolume'
import type { AttendancePeriod, AttendanceVolumeData } from '../types/attendance'

const DEFAULT_VOLUME_DATA: AttendanceVolumeData = {
  period: 'Week',
  totalScans: 0,
  points: [],
  peakCount: 0,
  periodDescription: 'Loading attendance volume...',
}

export function useAttendanceVolume(
  workspaceId?: string,
  period: AttendancePeriod = 'Week',
  memberIds?: string[]
) {
  const memberKey = memberIds ? memberIds.slice().sort().join(',') : 'all'

  const {
    data: volumeData = DEFAULT_VOLUME_DATA,
    isLoading,
    refetch,
  } = useQuery<AttendanceVolumeData>({
    queryKey: ['attendanceVolume', workspaceId, period, memberKey],
    queryFn: () => fetchAttendanceVolume(workspaceId, period, memberIds),
    staleTime: 5000,
    refetchInterval: 10000,
  })

  return {
    volumeData,
    isLoading,
    refetch,
  }
}
