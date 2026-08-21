export interface AnalyticsEntry {
  date: string
  time: string
  staffId: string
  staffName: string
  department: string
  logType: 'SIGN-IN' | 'SIGN-OUT'
  stationId: string
}

export const analyticsEntries: AnalyticsEntry[] = [
  { date: 'Oct 24, 2024', time: '08:42:12 AM', staffId: 'CHR-0882-X', staffName: 'Sarah Jenkins', department: 'Deep Tech Lab', logType: 'SIGN-IN', stationId: 'Kiosk-Beta-04' },
  { date: 'Oct 24, 2024', time: '09:15:04 AM', staffId: 'CHR-0129-A', staffName: 'Marcus Thorne', department: 'Security Operations', logType: 'SIGN-OUT', stationId: 'Terminal-Gate-1' },
  { date: 'Oct 24, 2024', time: '10:05:59 AM', staffId: 'CHR-0991-L', staffName: 'Elena Rodriguez', department: 'Core Infrastructure', logType: 'SIGN-IN', stationId: 'Mobile-Log-W2' },
  { date: 'Oct 23, 2024', time: '05:40:22 PM', staffId: 'CHR-0763-S', staffName: 'David Chen', department: 'Hardware Engineering', logType: 'SIGN-OUT', stationId: 'Station-Alpha-09' },
  { date: 'Oct 23, 2024', time: '11:12:00 AM', staffId: 'CHR-0552-V', staffName: 'Alissa Volkov', department: 'Research & Dev', logType: 'SIGN-IN', stationId: 'Kiosk-Beta-04' },
]
