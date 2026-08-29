import { useState } from 'react'
import { Fingerprint, CheckCircle2, ScanLine, AlertCircle, Info, Hand } from 'lucide-react'
import { Modal, Button } from './components/ui'
import { captureAndStoreAngle, sanitizeUUID } from './services/biometricService'
import { AngleProgressBar } from './components/biometrics/AngleProgressBar'
import { EnrollmentDiagnosticsLogs } from './components/biometrics/EnrollmentDiagnosticsLogs'
import type { ScanAngleStep, EnrollmentStepLog, AngleScanResult } from './types/biometric'
import './styles/biometric-modal.css'
import './styles/biometric-actions.css'

const SCAN_STEPS: ScanAngleStep[] = [
  {
    angle: 'center',
    label: 'Center / Flat',
    instruction: 'Place your Right Index Finger flat in the middle of the scanner glass.',
    description: 'Core ridge capture',
  },
  {
    angle: 'left_edge',
    label: 'Left Tilt',
    instruction: 'Tilt your Right Index Finger slightly to the left to capture the left edge.',
    description: 'Left ridge capture',
  },
  {
    angle: 'right_edge',
    label: 'Right Tilt',
    instruction: 'Tilt your Right Index Finger slightly to the right to capture the right edge.',
    description: 'Right ridge capture',
  },
]

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
  organizationId = '00000000-0000-0000-0000-000000000000',
  onSuccess,
}: Props) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
  const [completedAngles, setCompletedAngles] = useState<Record<string, boolean>>({})
  const [logs, setLogs] = useState<EnrollmentStepLog[]>([])
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [, setResults] = useState<AngleScanResult[]>([])

  const currentStep = SCAN_STEPS[currentStepIndex]
  const validOrgId = sanitizeUUID(organizationId)

  const handleScanStep = async () => {
    setPhase('scanning')
    setErrorMessage('')

    try {
      const res = await captureAndStoreAngle({
        memberId,
        organizationId: validOrgId,
        staffName: memberName,
        angle: currentStep.angle,
        passNumber: currentStepIndex + 1,
        onLog: (newLog) => setLogs((prev) => [...prev, newLog]),
      })

      setResults((prev) => [...prev, res])
      setCompletedAngles((prev) => ({ ...prev, [currentStep.angle]: true }))

      if (currentStepIndex + 1 < SCAN_STEPS.length) {
        setCurrentStepIndex((prev) => prev + 1)
        setPhase('idle')
      } else {
        setPhase('success')
        if (onSuccess) onSuccess()
      }
    } catch (err: unknown) {
      setPhase('error')
      setErrorMessage(err instanceof Error ? err.message : 'Scan capture error occurred.')
    }
  }

  const handleReset = () => {
    setCurrentStepIndex(0)
    setPhase('idle')
    setCompletedAngles({})
    setLogs([])
    setErrorMessage('')
    setResults([])
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Biometric Fingerprint Enrollment"
      subtitle={`Enrolling ${memberName} • Futronic FS80H`}
      maxWidth="md"
    >
      <div className="flex flex-col gap-4">
        {/* Right Index Finger Requirement Callout */}
        <div className="flex items-start gap-3 p-3 bg-purple-50/80 border border-purple-200/80 rounded-2xl text-xs">
          <div className="w-8 h-8 rounded-xl bg-[#7c007e] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
            <Hand size={16} />
          </div>
          <div>
            <div className="font-bold text-zinc-900 text-xs">Use Only Your Right Index Finger</div>
            <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">
              To prevent kiosk confusion during check-in, all staff enroll their <strong>Right Index Finger</strong> (the pointer finger beside your right thumb).
            </p>
          </div>
        </div>

        {/* 3-Pass Angle Progress Bar */}
        <AngleProgressBar
          steps={SCAN_STEPS}
          activeStep={currentStepIndex}
          completedAngles={completedAngles}
        />

        {/* Main Sensor Guidance View */}
        <div className="flex flex-col items-center justify-center p-6 bg-zinc-50 border border-zinc-200/70 rounded-2xl min-h-[160px]">
          {phase === 'success' ? (
            <div className="text-center py-2">
              <CheckCircle2 size={54} className="text-emerald-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-zinc-900">3-Angle Capture Completed</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                Center, left edge, and right edge templates are stored in Supabase Storage and registered in the database.
              </p>
            </div>
          ) : phase === 'error' ? (
            <div className="text-center py-2">
              <AlertCircle size={48} className="text-rose-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-zinc-900">Scan Capture Error</h3>
              <p className="text-xs text-rose-600 mt-1 max-w-sm">{errorMessage}</p>
            </div>
          ) : (
            <>
              <Fingerprint
                size={68}
                className={`transition-all ${
                  phase === 'scanning'
                    ? 'text-[#7c007e] animate-pulse scale-110'
                    : 'text-zinc-400'
                }`}
              />
              <div className="text-center mt-3">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-100/70 text-[#7c007e] border border-purple-200 mb-1">
                  Pass {currentStepIndex + 1} of 3: {currentStep.label}
                </span>
                <p className="text-xs font-semibold text-zinc-800 max-w-xs mt-0.5">
                  {phase === 'scanning'
                    ? 'Capturing from optical sensor. Keep finger steady on scanner glass...'
                    : currentStep.instruction}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Diagnostic Logs */}
        <EnrollmentDiagnosticsLogs logs={logs} />

        {/* Footer Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Info size={13} />
            <span>3 passes ensure reliable matching from any angle.</span>
          </div>

          <div className="flex items-center gap-2">
            {phase === 'success' ? (
              <Button variant="primary" onClick={handleClose}>
                Finish
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
                {phase === 'error' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<ScanLine size={15} />}
                    onClick={handleScanStep}
                  >
                    Retry Pass {currentStepIndex + 1}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={phase === 'scanning'}
                    leftIcon={<ScanLine size={15} />}
                    onClick={handleScanStep}
                  >
                    {phase === 'scanning'
                      ? 'Scanning...'
                      : `Capture Pass ${currentStepIndex + 1} (${currentStep.label})`}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
