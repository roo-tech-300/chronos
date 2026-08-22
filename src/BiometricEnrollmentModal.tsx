import { useState } from 'react'
import { Fingerprint, Info, ScanLine, CheckCircle } from 'lucide-react'
import { Modal, Button, Badge } from './components/ui'
import './styles/biometric-modal.css'
import './styles/biometric-actions.css'

interface Props {
  open: boolean
  onClose: () => void
}

export default function BiometricEnrollmentModal({ open, onClose }: Props) {
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'success'>('idle')

  function handleBeginScan() {
    setPhase('scanning')
    setTimeout(() => setPhase('success'), 2000)
  }

  function handleClose() {
    setPhase('idle')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Biometric Credential Setup"
      subtitle="Enrollment Wizard • Cryptographic Hashed Signature"
      maxWidth="md"
    >
      <div className="flex flex-col gap-5">
        <div className="bio-steps">
          <div className="bio-step active">
            <div className="bio-step-circle">1</div>
            <span>Left Side</span>
          </div>
          <div className="bio-step-line" />
          <div className="bio-step">
            <div className="bio-step-circle">2</div>
            <span>Center Scan</span>
          </div>
          <div className="bio-step-line" />
          <div className="bio-step">
            <div className="bio-step-circle">3</div>
            <span>Right Scan</span>
          </div>
        </div>

        <div className="bio-body">
          {phase === 'success' ? (
            <div className="bio-success">
              <CheckCircle size={56} className="text-emerald-500 mb-3" />
              <h3 className="text-base font-bold text-zinc-900">Biometric Enrollment Successful</h3>
              <p className="text-xs text-zinc-500 mt-1">Hashed token registered across all active stations</p>
            </div>
          ) : (
            <>
              <Fingerprint size={80} className={`bio-finger ${phase === 'scanning' ? 'animate-pulse text-zinc-900' : 'text-zinc-400'}`} />
              <p className="bio-instruct text-center">
                {phase === 'scanning'
                  ? 'Scanning your fingerprint signature...'
                  : 'Place your finger firmly on the sensor to begin enrollment.'}
              </p>

              <div className="bio-metrics w-full">
                <div className="bio-metric">
                  <div className="bio-metric-header">
                    <span>Scan Quality</span>
                    <span>{phase === 'scanning' ? '78%' : '0%'}</span>
                  </div>
                  <div className="bio-bar">
                    <div
                      className="bio-bar-fill"
                      style={{ width: phase === 'scanning' ? '78%' : '0%' }}
                    />
                  </div>
                </div>
                <div className="bio-metric">
                  <div className="bio-metric-header">
                    <span>Points</span>
                    <span>{phase === 'scanning' ? '184' : '0'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-2">
                <Badge
                  variant={phase === 'scanning' ? 'info' : 'neutral'}
                  showDot
                  pulseDot={phase === 'scanning'}
                >
                  {phase === 'scanning' ? 'Scanning...' : 'Ready'}
                </Badge>
              </div>
            </>
          )}
        </div>

        {phase !== 'success' && (
          <div className="flex items-start gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200/60 text-xs text-zinc-500 leading-relaxed">
            <Info size={16} className="shrink-0 mt-0.5 text-zinc-400" />
            <span>
              Chronos uses irreversible cryptographic feature maps. No raw raster images are stored.
            </span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
          {phase === 'success' ? (
            <Button variant="primary" onClick={handleClose}>Close</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              {phase === 'idle' && (
                <Button
                  variant="primary"
                  leftIcon={<ScanLine size={16} />}
                  onClick={handleBeginScan}
                >
                  Begin Scan
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}

