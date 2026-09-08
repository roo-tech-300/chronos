import { useQuery } from '@tanstack/react-query'
import { getLastScanToday } from '../services/attendanceService'

/**
 * Real clock-in status for one member, read straight from today's attendance
 * logs (same source the kiosk writes to). Polls every 30s so the navbar and
 * My Day header stay current without manual refreshes.
 */
export function useMemberClockIn(memberId?: string) {
  return useQuery({
    queryKey: ['member-last-scan', memberId],
    queryFn: () => (memberId ? getLastScanToday(memberId) : null),
    enabled: Boolean(memberId),
    refetchInterval: 30000,
  })
}

/** "08:12 AM"-style label for a scan timestamp; undefined when absent. */
export function formatClockInTime(scanTimestamp?: string | null): string | undefined {
  if (!scanTimestamp) return undefined
  return new Date(scanTimestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}
