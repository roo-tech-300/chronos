import { useState, useEffect, useCallback, useRef } from 'react'
import { futronicBridge } from '../services/futronicBridge'
import { logAttendanceScan } from '../services/attendanceService'
import { resolveStaffByMemberId } from '../services/identityResolver'
import { getMemberTodayTaskBrief, type MemberTaskBrief } from '../services/attendanceTaskLinker'
import type { TerminalDevice, NodeBridgeMatch } from '../types/terminal'
import type { AttendanceDirection } from '../types/attendance'

export interface ScannedStaffResult {
  name: string
  id: string
  time: string
  dept: string
  role?: string
  avatarUrl?: string
  type: 'Check-In' | 'Check-Out'
  statusMessage?: string
  dbSaved?: boolean
  taskBrief?: MemberTaskBrief
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

  // Handle a user match identified by Node Bridge
  const handleNodeBridgeMatch = useCallback(
    async (match: NodeBridgeMatch) => {
      setScanStatus('scanning')
      setErrorMessage(null)

      try {
        const terminalId = terminal?.id
        const workspaceId = terminal?.workspaceId
        const explicitDirection: AttendanceDirection | undefined =
          terminal?.mode === 'entry' ? 'in' : terminal?.mode === 'exit' ? 'out' : undefined

        // Validate if memberId exists in database and belongs to this workspace
        const memberIdToLookup = match.id || match.studentId || match.memberId || ''
        const resolved = await resolveStaffByMemberId(memberIdToLookup, workspaceId)

        if (!resolved || !resolved.isMemberOfWorkspace || !resolved.name) {
          setErrorMessage(resolved?.error || 'User is not a member of this workspace.')
          setScanStatus('error')
          isProcessingRef.current = false
          return
        }

        const result = await logAttendanceScan({
          memberId: resolved.memberId,
          workspaceId,
          terminalId,
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

        // Fetch today's pending tasks brief for the scanned member.
        // The kiosk's device token routes through the anon-safe RPC;
        // dashboard contexts without a token use the RLS-scoped query.
        const taskBrief = await getMemberTodayTaskBrief(
          resolved.memberId,
          workspaceId,
          terminal?.deviceToken
        )

        setLastScannedStaff({
          name: resolved.name,
          id: resolved.memberId,
          time: timeStr,
          dept: resolved.department,
          role: resolved.role,
          avatarUrl: resolved.avatarUrl,
          type: resolvedDirection === 'in' ? 'Check-In' : 'Check-Out',
          statusMessage: result.message,
          dbSaved: result.dbSaved,
          taskBrief,
        })
        setScanStatus('success')
      } catch (err) {
        console.error('[Kiosk] Attendance log error:', err)
        setErrorMessage(err instanceof Error ? err.message : 'Failed to record attendance.')
        setScanStatus('error')
        isProcessingRef.current = false
      }
    },
    [terminal]
  )

  // Listen to live WebSocket events pushed by Node Bridge
  useEffect(() => {
    futronicBridge.connectWebSocket()

    const unsubscribeScan = futronicBridge.onScanEvent(async (payload) => {
      if (isProcessingRef.current) return
      isProcessingRef.current = true

      // Node bridge explicitly reported no match or error
      if (payload.matched === false || payload.status === 'error' || payload.error) {
        setErrorMessage(payload.error || payload.message || 'No matching user found on Node Bridge.')
        setScanStatus('error')
        isProcessingRef.current = false
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
      isProcessingRef.current = false
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
    isProcessingRef.current = true

    setScanStatus('scanning')
    setErrorMessage(null)

    try {
      const res = await futronicBridge.triggerCapture()

      // Node bridge failed to read scanner
      if (!res.success && !res.matched) {
        setErrorMessage(res.error || 'Node bridge: Failed to capture fingerprint.')
        setScanStatus('error')
        isProcessingRef.current = false
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
      isProcessingRef.current = false
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Node bridge is unreachable on 127.0.0.1:8080.')
      setScanStatus('error')
      isProcessingRef.current = false
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
