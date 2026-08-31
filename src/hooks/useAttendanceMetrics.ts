import { useQuery } from '@tanstack/react-query'
import {
  fetchRecentLiveScans,
  exportWorkspaceAttendanceLogs,
} from '../services/attendanceReporting'
import { fetchLiveHeadcount, type LiveHeadcountResult } from '../services/liveHeadcountService'
import type { AttendanceSummary, OnSiteMember } from '../types/attendance'
import type { LiveScanFeedItem } from '../services/attendanceReporting'

const DEFAULT_SUMMARY: AttendanceSummary = {
  totalExpected: 50,
  currentlyOnSite: 0,
  departedToday: 0,
  totalScansToday: 0,
  attendanceRate: 0,
}

export function useAttendanceMetrics(workspaceId?: string, totalStaffCount = 50) {
  // 1. Fetch real-time live headcount and on-site staff from database
  const {
    data: headcountData = {
      summary: { ...DEFAULT_SUMMARY, totalExpected: totalStaffCount },
      onSiteMembers: [] as OnSiteMember[],
    },
    isLoading: isHeadcountLoading,
    refetch: refetchSummary,
  } = useQuery<LiveHeadcountResult>({
    queryKey: ['liveHeadcount', workspaceId, totalStaffCount],
    queryFn: () => fetchLiveHeadcount(workspaceId, totalStaffCount),
    refetchInterval: 5000,
    staleTime: 2500,
  })

  // 2. Fetch live recent scan stream
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
    summary: headcountData.summary,
    onSiteMembers: headcountData.onSiteMembers,
    liveScans,
    isLoading: isHeadcountLoading || isLiveScansLoading,
    refetchSummary,
    refetchLiveScans,
    exportReport,
  }
}

