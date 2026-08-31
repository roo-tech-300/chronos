import { useState, useEffect } from 'react'
import { AlertCircle, Clock, X } from 'lucide-react'
import { getInitials } from '../../dummy/roster-mock'
import { futronicBridge } from '../../services/futronicBridge'
import { resolveStaffByMemberId } from '../../services/identityResolver'
import { logAttendanceScan } from '../../services/attendanceService'
import type { BiometricCapturePayload } from '../../types/terminal'

export default function GlobalScanNotificationToast() {
  const [activeToast, setActiveToast] = useState<{
    id: string
    name: string
    dept: string
    role?: string
    time: string
    direction: 'Check-In' | 'Check-Out'
    score?: number
    isError?: boolean
    errorMessage?: string
  } | null>(null)

  useEffect(() => {
    futronicBridge.connectWebSocket()

    const unsubscribe = futronicBridge.onScanEvent(async (payload: BiometricCapturePayload) => {
      const timeStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })

      if (payload.matched && payload.match) {
        const match = payload.match
        const memberIdToLookup = match.id || match.studentId || match.memberId || ''
        const resolved = await resolveStaffByMemberId(memberIdToLookup)

        if (!resolved || !resolved.isMemberOfWorkspace || !resolved.name) {
          setActiveToast({
            id: memberIdToLookup,
            name: resolved?.name || 'Unauthorized Member',
            dept: resolved?.department || '',
            time: timeStr,
            direction: 'Check-In',
            isError: true,
            errorMessage: resolved?.error || 'User is not a member of this workspace.',
          })
          return
        }

        const staffName = resolved.name
        const dept = resolved.department || 'Academic Staff'
        const role = resolved.role || 'Staff'

        try {
          const logRes = await logAttendanceScan({
            memberId: memberIdToLookup,
            staffName,
            department: dept,
            terminalId: '5af3f6a1-ff4a-4591-8752-e14cd953e6c2',
            organizationId: '00000000-0000-0000-0000-000000000000',
            verificationMode: 'biometric_fs80h',
            confidenceScore: match.confidence || match.score || 98,
          })

          const direction = logRes.log?.direction === 'out' ? 'Check-Out' : 'Check-In'
          setActiveToast({
            id: memberIdToLookup,
            name: staffName,
            dept,
            role,
            time: timeStr,
            direction,
            score: match.confidence || match.score || 98,
          })
        } catch {
          setActiveToast({
            id: memberIdToLookup,
            name: staffName,
            dept,
            role,
            time: timeStr,
            direction: 'Check-In',
            score: match.confidence || match.score || 98,
          })
        }
      } else if (payload.matched === false || payload.error) {
        setActiveToast({
          id: 'UNMATCHED',
          name: 'Unrecognized Fingerprint',
          dept: '',
          time: timeStr,
          direction: 'Check-In',
          isError: true,
          errorMessage: payload.error || payload.message || 'No matching enrolled user found in database.',
        })
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [activeToast])

  if (!activeToast) return null

  const initials = getInitials(activeToast.name || 'SM')

  return (
    <aside
      aria-label="Scan notification"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white border-2 shadow-2xl rounded-2xl p-4 transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in"
      style={{
        borderColor: activeToast.isError ? '#ef4444' : '#10b981',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-black font-mono text-sm tracking-wider border shadow-sm ${
              activeToast.isError
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-purple-50 text-[#7c007e] border-purple-200 ring-2 ring-purple-50'
            }`}
          >
            {activeToast.isError ? <AlertCircle size={22} /> : initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  activeToast.isError
                    ? 'bg-red-100 text-red-700'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {activeToast.isError ? 'Scan Error' : `${activeToast.direction} Confirmed`}
              </span>
              {activeToast.role && !activeToast.isError && (
                <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
                  {activeToast.role}
                </span>
              )}
              {activeToast.score && !activeToast.isError && (
                <span className="text-[10px] font-mono text-zinc-500 font-bold">
                  Score: {activeToast.score}
                </span>
              )}
            </div>
            <h4 className="text-base font-extrabold text-zinc-900 mt-1 leading-snug">
              {activeToast.name}
            </h4>
            {activeToast.isError ? (
              <p className="text-xs text-red-600 mt-0.5">{activeToast.errorMessage}</p>
            ) : (
              activeToast.dept && (
                <p className="text-xs text-zinc-500 mt-0.5 font-medium">{activeToast.dept}</p>
              )
            )}
            <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-2 font-mono">
              <Clock size={11} />
              <span>{activeToast.time}</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveToast(null)}
          className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100 cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
    </aside>
  )
}
