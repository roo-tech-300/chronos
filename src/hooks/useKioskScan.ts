import { useState, useEffect, useCallback, useRef } from 'react'
import { futronicBridge } from '../services/futronicBridge'
import { logAttendanceScan } from '../services/attendanceService'
import type { TerminalDevice } from '../types/terminal'
import type { AttendanceDirection } from '../types/attendance'

export interface ScannedStaffResult {
  name: string
  id: string
  time: string
  dept: string
  type: 'Check-In' | 'Check-Out'
  statusMessage?: string
}

export function useKioskScan(terminal: TerminalDevice | null) {
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
  const [lastScannedStaff, setLastScannedStaff] = useState<ScannedStaffResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isProcessingRef = useRef(false)

  // Auto-reset state after 3.0 seconds (Rule #8)
  useEffect(() => {
    if (scanStatus === 'success' || scanStatus === 'error') {
      const timer = setTimeout(() => {
        setScanStatus('idle')
        setLastScannedStaff(null)
        setErrorMessage(null)
        isProcessingRef.current = false
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [scanStatus])

  // Core biometric scan and attendance logging execution
  const processAttendanceScan = useCallback(
    async (staffData: {
      memberId: string
      staffName: string
      department?: string
      direction?: AttendanceDirection
    }) => {
      if (isProcessingRef.current) return
      isProcessingRef.current = true
      setScanStatus('scanning')
      setErrorMessage(null)

      try {
        const terminalId = terminal?.id || 'STATION-01'
        const orgId = terminal?.workspaceId || '00000000-0000-0000-0000-000000000000'
        const terminalModeDirection =
          terminal?.mode === 'entry' ? 'in' : terminal?.mode === 'exit' ? 'out' : staffData.direction

        const result = await logAttendanceScan({
          memberId: staffData.memberId,
          staffName: staffData.staffName,
          department: staffData.department || 'Academic Staff',
          terminalId,
          organizationId: orgId,
          explicitDirection: terminalModeDirection,
          verificationMode: 'biometric_fs80h',
          confidenceScore: 99,
        })

        const resolvedDirection = result.log?.direction || terminalModeDirection || 'in'
        const timeStr = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })

        setLastScannedStaff({
          name: staffData.staffName,
          id: staffData.memberId,
          time: timeStr,
          dept: staffData.department || 'Faculty Member',
          type: resolvedDirection === 'in' ? 'Check-In' : 'Check-Out',
          statusMessage: result.message,
        })
        setScanStatus('success')
      } catch (err) {
        console.error('Kiosk scan error:', err)
        setErrorMessage(err instanceof Error ? err.message : 'Scan verification failed')
        setScanStatus('error')
      }
    },
    [terminal]
  )

  // Hardware Scanner integration via Futronic Bridge (WebSocket & trigger)
  useEffect(() => {
    futronicBridge.connectWebSocket()

    const unsubscribe = futronicBridge.onScanEvent(async (payload) => {
      if (isProcessingRef.current) return
      console.log('[Kiosk] Hardware scan detected:', payload.templateHash)

      // In real deployment, match hash against enrolled staff or trigger identity resolution
      await processAttendanceScan({
        memberId: 'CHR-0001',
        staffName: 'Dr. Amina Bello',
        department: 'Computer Engineering',
      })
    })

    return () => {
      unsubscribe()
      futronicBridge.disconnectWebSocket()
    }
  }, [processAttendanceScan])

  // Trigger manual or simulated scanner event
  const triggerScan = useCallback(
    async (staffName: string, staffId: string, dept: string) => {
      await processAttendanceScan({
        memberId: staffId,
        staffName,
        department: dept,
      })
    },
    [processAttendanceScan]
  )

  return {
    scanStatus,
    lastScannedStaff,
    errorMessage,
    triggerScan,
  }
}
