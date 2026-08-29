import { useQuery } from '@tanstack/react-query'
import {
  fetchTodaySummary,
  fetchRecentLiveScans,
  exportWorkspaceAttendanceLogs,
} from '../services/attendanceReporting'
import type { AttendanceSummary } from '../types/attendance'
import type { LiveScanFeedItem } from '../services/attendanceReporting'

export function useAttendanceMetrics(workspaceId?: string, totalStaffCount = 50) {
  // 1. Fetch real-time attendance summary every 8 seconds
  const {
    data: summary = {
      totalExpected: totalStaffCount,
      currentlyOnSite: 0,
      departedToday: 0,
      totalScansToday: 0,
      attendanceRate: 0,
    },
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useQuery<AttendanceSummary>({
    queryKey: ['attendanceSummary', workspaceId, totalStaffCount],
    queryFn: () => fetchTodaySummary(workspaceId, totalStaffCount),
    refetchInterval: 8000,
    staleTime: 4000,
  })

  // 2. Fetch live recent scan stream every 5 seconds
  const {
    data: liveScans = [],
    isLoading: isLiveScansLoading,
    refetch: refetchLiveScans,
  } = useQuery<LiveScanFeedItem[]>({
    queryKey: ['liveScansFeed', workspaceId],
    queryFn: () => fetchRecentLiveScans(workspaceId, 6),
    refetchInterval: 5000,
    staleTime: 2500,
  })

  const exportReport = async (workspaceName?: string) => {
    await exportWorkspaceAttendanceLogs(workspaceId, workspaceName)
  }

  return {
    summary,
    liveScans,
    isLoading: isSummaryLoading || isLiveScansLoading,
    refetchSummary,
    refetchLiveScans,
    exportReport,
  }
}
