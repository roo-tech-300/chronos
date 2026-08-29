import { useState } from 'react'
import { Fingerprint, Info, ScanLine, CheckCircle, Terminal, AlertCircle } from 'lucide-react'
import { Modal, Button, Badge } from './components/ui'
import { enrollStaffFingerprint, type EnrollmentStepLog } from './services/biometricService'
import './styles/biometric-modal.css'
import './styles/biometric-actions.css'

interface Props {
  open: boolean
  onClose: () => void
  memberId?: string
  memberName?: string
  organizationId?: string
  onSuccess?: () => void
}

export default function BiometricEnrollmentModal({
  open,
  onClose,
  memberId = 'wm_usr_current',
  memberName = 'Staff Member',
  organizationId = 'default-org',
  onSuccess,
}: Props) {
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
  const [logs, setLogs] = useState<EnrollmentStepLog[]>([])
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [fingerPosition, setFingerPosition] = useState<string>('right_index')

  const handleBeginScan = async () => {
    setPhase('scanning')
    setErrorMessage('')
    setLogs([])

    const result = await enrollStaffFingerprint({
      memberId,
      organizationId,
      staffName: memberName,
      fingerPosition,
      onLog: (newLog) => {
        setLogs((prev) => [...prev, newLog])
      },
    })

    if (result.success) {
      setPhase('success')
      if (onSuccess) onSuccess()
    } else {
      setPhase('error')
      setErrorMessage(result.error || 'Failed to complete enrollment.')
    }
  }

  const handleClose = () => {
    setPhase('idle')
    setLogs([])
    setErrorMessage('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Biometric Credential Setup"
      subtitle={`Enrolling ${memberName} • Futronic FS80H Scanner`}
      maxWidth="md"
    >
      <div className="flex flex-col gap-4">
        {/* Finger Selection */}
        {phase === 'idle' && (
          <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200/70 rounded-xl text-xs">
            <span className="font-medium text-zinc-700">Select Finger:</span>
            <select
              value={fingerPosition}
              onChange={(e) => setFingerPosition(e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-zinc-300 rounded-lg text-zinc-800 focus:outline-none"
            >
              <option value="right_index">Right Index Finger</option>
              <option value="right_thumb">Right Thumb</option>
              <option value="left_index">Left Index Finger</option>
              <option value="left_thumb">Left Thumb</option>
            </select>
          </div>
        )}

        <div className="bio-body">
          {phase === 'success' ? (
            <div className="bio-success py-4">
              <CheckCircle size={52} className="text-emerald-500 mb-2" />
              <h3 className="text-base font-bold text-zinc-900">Biometric Enrollment Successful</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Template securely stored in Supabase Storage and registered in database.
              </p>
            </div>
          ) : phase === 'error' ? (
            <div className="text-center py-4">
              <AlertCircle size={48} className="text-rose-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-zinc-900">Enrollment Encountered An Issue</h3>
              <p className="text-xs text-rose-600 mt-1 max-w-sm mx-auto">{errorMessage}</p>
            </div>
          ) : (
            <>
              <Fingerprint
                size={72}
                className={`bio-finger ${
                  phase === 'scanning' ? 'animate-pulse text-violet-600' : 'text-zinc-400'
                }`}
              />
              <p className="bio-instruct text-center text-xs">
                {phase === 'scanning'
                  ? 'Sensor is active. Place your finger firmly on the Futronic scanner glass...'
                  : 'Place your finger on the optical sensor and click "Begin Scan".'}
              </p>

              <div className="mt-1">
                <Badge
                  variant={phase === 'scanning' ? 'info' : 'neutral'}
                  showDot
                  pulseDot={phase === 'scanning'}
                >
                  {phase === 'scanning' ? 'Capturing Fingerprint...' : 'Ready'}
                </Badge>
              </div>
            </>
          )}
        </div>

        {/* Step-by-Step Diagnostic Logs Feed */}
        {logs.length > 0 && (
          <div className="p-3 bg-zinc-950 text-zinc-200 rounded-xl font-mono text-[11px] border border-zinc-800 shadow-inner">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5 font-sans font-medium">
                <Terminal size={13} className="text-violet-400" />
                Live Enrollment Diagnostics
              </span>
              <span className="text-[10px] text-zinc-500">Node Bridge + Supabase</span>
            </div>
            <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2">
                  <span className="text-zinc-500 select-none">[{log.time}]</span>
                  <span
                    className={
                      log.type === 'success'
                        ? 'text-emerald-400 font-semibold'
                        : log.type === 'error'
                        ? 'text-rose-400 font-semibold'
                        : log.type === 'warn'
                        ? 'text-amber-400'
                        : 'text-zinc-300'
                    }
                  >
                    {log.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase !== 'success' && (
          <div className="flex items-start gap-2 p-2.5 bg-zinc-50 rounded-xl border border-zinc-200/60 text-[11px] text-zinc-500 leading-relaxed">
            <Info size={15} className="shrink-0 mt-0.5 text-zinc-400" />
            <span>
              Irreversible cryptographic feature templates (ANSI-378 / ISO) are extracted. No raw raster images are stored.
            </span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100">
          {phase === 'success' ? (
            <Button variant="primary" onClick={handleClose}>
              Done
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                {phase === 'error' ? 'Close' : 'Cancel'}
              </Button>
              {phase === 'idle' && (
                <Button
                  variant="primary"
                  leftIcon={<ScanLine size={16} />}
                  onClick={handleBeginScan}
                >
                  Begin Scan
                </Button>
              )}
              {phase === 'error' && (
                <Button
                  variant="primary"
                  leftIcon={<ScanLine size={16} />}
                  onClick={handleBeginScan}
                >
                  Retry Scan
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
