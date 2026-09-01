import { getSupabase } from '../lib/supabase'
import { isUuid } from '../utils/uuid'
import type { AttendanceChartPoint, AttendancePeriod, AttendanceVolumeData } from '../types/attendance'

interface RawScanTimestamp {
  scan_timestamp: string
}

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function fetchAttendanceVolume(
  workspaceId?: string,
  period: AttendancePeriod = 'Week'
): Promise<AttendanceVolumeData> {
  const supabase = getSupabase()
  const now = new Date()
  const startDate = new Date()
  let periodDescription: string

  if (period === 'Day') {
    startDate.setHours(0, 0, 0, 0)
    periodDescription = "Today's hourly attendance distribution"
  } else if (period === 'Month') {
    startDate.setDate(now.getDate() - 30)
    startDate.setHours(0, 0, 0, 0)
    periodDescription = 'Last 30 days aggregated volume'
  } else {
    // Week / 14 days default
    startDate.setDate(now.getDate() - 13)
    startDate.setHours(0, 0, 0, 0)
    periodDescription = 'Last 14 days aggregated by day'
  }

  let scans: RawScanTimestamp[] = []

  if (workspaceId && isUuid(workspaceId)) {
    try {
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('scan_timestamp')
        .eq('workspace_id', workspaceId)
        .gte('scan_timestamp', startDate.toISOString())
        .lte('scan_timestamp', now.toISOString())
        .order('scan_timestamp', { ascending: true })

      if (!error && data) {
        scans = data
      }
    } catch (err) {
      console.warn('[AttendanceVolume] Query error:', err)
    }
  }

  const totalScans = scans.length
  let points: AttendanceChartPoint[]

  if (period === 'Day') {
    // 12 two-hour intervals across the 24h day
    const hourSlots = [
      { start: 0, end: 2, label: '00h' },
      { start: 2, end: 4, label: '02h' },
      { start: 4, end: 6, label: '04h' },
      { start: 6, end: 8, label: '06h' },
      { start: 8, end: 10, label: '08h' },
      { start: 10, end: 12, label: '10h' },
      { start: 12, end: 14, label: '12h' },
      { start: 14, end: 16, label: '14h' },
      { start: 16, end: 18, label: '16h' },
      { start: 18, end: 20, label: '18h' },
      { start: 20, end: 22, label: '20h' },
      { start: 22, end: 24, label: '22h' },
    ]

    const counts = new Array(hourSlots.length).fill(0)
    scans.forEach((s) => {
      const h = new Date(s.scan_timestamp).getHours()
      const slotIndex = Math.min(Math.floor(h / 2), hourSlots.length - 1)
      counts[slotIndex]++
    })

    const maxCount = Math.max(...counts, 0)
    points = hourSlots.map((slot, i) => {
      const c = counts[i]
      const percentage = maxCount > 0 ? Math.max(6, Math.round((c / maxCount) * 100)) : 6
      return {
        label: slot.label,
        fullLabel: `${slot.start}:00 - ${slot.end}:00`,
        count: c,
        percentage,
        isPeak: c > 0 && c === maxCount,
      }
    })
  } else if (period === 'Month') {
    // 10 3-day blocks across the 30 days
    const numBlocks = 10
    const blockCounts = new Array(numBlocks).fill(0)
    const blockLabels: string[] = []

    for (let i = 0; i < numBlocks; i++) {
      const blockStart = new Date(startDate.getTime() + i * 3 * 86400000)
      blockLabels.push(`${blockStart.getMonth() + 1}/${blockStart.getDate()}`)
    }

    scans.forEach((s) => {
      const timeDiff = new Date(s.scan_timestamp).getTime() - startDate.getTime()
      const dayIndex = Math.floor(timeDiff / (3 * 86400000))
      const idx = Math.max(0, Math.min(dayIndex, numBlocks - 1))
      blockCounts[idx]++
    })

    const maxCount = Math.max(...blockCounts, 0)
    points = blockLabels.map((lbl, i) => {
      const c = blockCounts[i]
      const percentage = maxCount > 0 ? Math.max(6, Math.round((c / maxCount) * 100)) : 6
      return {
        label: lbl,
        fullLabel: `Period ending ${lbl}`,
        count: c,
        percentage,
        isPeak: c > 0 && c === maxCount,
      }
    })
  } else {
    // 14 days breakdown
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    const dayMap = new Map<string, { label: string; fullLabel: string; count: number }>()

    for (let i = 0; i < 14; i++) {
      const d = new Date(startDate.getTime() + i * 86400000)
      const key = formatDateKey(d)
      const label = dayNames[d.getDay()]
      const fullLabel = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
      dayMap.set(key, { label, fullLabel, count: 0 })
    }

    scans.forEach((s) => {
      const key = formatDateKey(new Date(s.scan_timestamp))
      const existing = dayMap.get(key)
      if (existing) {
        existing.count++
      }
    })

    const pointEntries = Array.from(dayMap.values())
    const maxCount = Math.max(...pointEntries.map((p) => p.count), 0)

    points = pointEntries.map((p) => {
      const percentage = maxCount > 0 ? Math.max(6, Math.round((p.count / maxCount) * 100)) : 6
      return {
        label: p.label,
        fullLabel: p.fullLabel,
        count: p.count,
        percentage,
        isPeak: p.count > 0 && p.count === maxCount,
      }
    })
  }

  const peakCount = Math.max(...points.map((p) => p.count), 0)

  return {
    period,
    totalScans,
    points,
    peakCount,
    periodDescription:
      totalScans > 0
        ? `${periodDescription} • ${totalScans.toLocaleString()} ${totalScans === 1 ? 'scan' : 'scans'} recorded`
        : `${periodDescription} • 0 scans recorded`,
  }
}
