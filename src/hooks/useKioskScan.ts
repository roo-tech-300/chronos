import { useState, useEffect, useCallback, useRef } from 'react'
import { futronicBridge } from '../services/futronicBridge'
import { logAttendanceScan } from '../services/attendanceService'
import { getSupabase } from '../lib/supabase'
import type { TerminalDevice, NodeBridgeMatch } from '../types/terminal'
import type { AttendanceDirection } from '../types/attendance'

export interface ScannedStaffResult {
  name: string
  id: string
  time: string
  dept: string
  type: 'Check-In' | 'Check-Out'
  statusMessage?: string
  dbSaved?: boolean
}

export function useKioskScan(terminal: TerminalDevice | null) {
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
  const [lastScannedStaff, setLastScannedStaff] = useState<ScannedStaffResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [hardwareDetected, setHardwareDetected] = useState(false)
  const isProcessingRef = useRef(false)

  // Auto-reset state back to passive scanning after exactly 3.0s (Rule #8)
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

  // Resolve staff metadata strictly for the matched user identified by Node Bridge
  const fetchProfileForNodeMatch = async (match: NodeBridgeMatch) => {
    const supabase = getSupabase()
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, department, role')
        .eq('id', match.id)
        .maybeSingle()

      if (profile) {
        return {
          name: profile.full_name || match.name || 'Staff Member',
          dept: profile.department || match.department || 'Academic Staff',
        }
      }
    } catch {
      // Offline fallback
    }

    return {
      name: match.name || 'Staff Member',
      dept: match.department || 'Academic Staff',
    }
  }

  // Handle a user match identified by Node Bridge
  const handleNodeBridgeMatch = useCallback(
    async (match: NodeBridgeMatch) => {
      if (isProcessingRef.current) return
      isProcessingRef.current = true
      setScanStatus('scanning')
      setErrorMessage(null)

      try {
        const terminalId = terminal?.id || '5af3f6a1-ff4a-4591-8752-e14cd953e6c2'
        const orgId = terminal?.workspaceId || '00000000-0000-0000-0000-000000000000'
        const explicitDirection: AttendanceDirection | undefined =
          terminal?.mode === 'entry' ? 'in' : terminal?.mode === 'exit' ? 'out' : undefined

        const profile = await fetchProfileForNodeMatch(match)

        const result = await logAttendanceScan({
          memberId: match.id,
          staffName: profile.name,
          department: profile.dept,
          terminalId,
          organizationId: orgId,
          explicitDirection,
          verificationMode: 'biometric_fs80h',
          confidenceScore: match.confidence || match.score || 98,
        })

        const resolvedDirection = result.log?.direction || explicitDirection || 'in'
        const timeStr = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })

        setLastScannedStaff({
          name: profile.name,
          id: match.id,
          time: timeStr,
          dept: profile.dept,
          type: resolvedDirection === 'in' ? 'Check-In' : 'Check-Out',
          statusMessage: result.message,
          dbSaved: result.dbSaved,
        })
        setScanStatus('success')
      } catch (err) {
        console.error('[Kiosk] Attendance log error:', err)
        setErrorMessage(err instanceof Error ? err.message : 'Failed to record attendance.')
        setScanStatus('error')
      }
    },
    [terminal]
  )

  // Listen to live WebSocket events pushed by Node Bridge
  useEffect(() => {
    futronicBridge.connectWebSocket()

    const unsubscribeScan = futronicBridge.onScanEvent(async (payload) => {
      if (isProcessingRef.current) return

      // Node bridge explicitly reported no match or error
      if (payload.matched === false || payload.status === 'error' || payload.error) {
        setErrorMessage(payload.error || payload.message || 'No matching user found on Node Bridge.')
        setScanStatus('error')
        return
      }

      // Node bridge reported matched user
      if (payload.matched && payload.match) {
        await handleNodeBridgeMatch(payload.match)
        return
      }

      // Node bridge sent unmatched capture
      setErrorMessage('Unrecognized Fingerprint: Node Bridge did not match any enrolled user.')
      setScanStatus('error')
    })

    const unsubscribeStatus = futronicBridge.onStatusEvent((status) => {
      setHardwareDetected(status.isConnected)
    })

    return () => {
      unsubscribeScan()
      unsubscribeStatus()
      futronicBridge.disconnectWebSocket()
    }
  }, [handleNodeBridgeMatch])

  // Trigger optical scanner identification via Node Bridge
  const triggerOpticalScan = useCallback(async () => {
    if (isProcessingRef.current) return

    setScanStatus('scanning')
    setErrorMessage(null)

    try {
      const res = await futronicBridge.triggerCapture()

      // Node bridge failed to read scanner
      if (!res.success && !res.matched) {
        setErrorMessage(res.error || 'Node bridge: Failed to capture fingerprint.')
        setScanStatus('error')
        return
      }

      // Node bridge found a matched user
      if (res.matched && res.match) {
        await handleNodeBridgeMatch(res.match)
        return
      }

      // Node bridge explicitly found no match
      setErrorMessage(res.error || 'No matching enrolled user found on Node Bridge.')
      setScanStatus('error')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Node bridge is unreachable on 127.0.0.1:8080.')
      setScanStatus('error')
    }
  }, [handleNodeBridgeMatch])

  return {
    scanStatus,
    lastScannedStaff,
    errorMessage,
    hardwareDetected,
    triggerScan: triggerOpticalScan,
  }
}
