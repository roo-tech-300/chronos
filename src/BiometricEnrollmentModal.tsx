import { useState } from 'react'
import { Fingerprint, X, Info, ScanLine, CheckCircle } from 'lucide-react'
import './styles/biometric-modal.css'
import './styles/biometric-actions.css'

interface Props {
  open: boolean
  onClose: () => void
}

export default function BiometricEnrollmentModal({ open, onClose }: Props) {
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'success'>('idle')

  if (!open) return null

  function handleOverlay(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  function handleBeginScan() {
    setPhase('scanning')
    setTimeout(() => setPhase('success'), 2000)
  }

  function handleClose() {
    setPhase('idle')
    onClose()
  }

  return (
    <div className="bio-overlay" onClick={handleOverlay}>
      <div className="bio-modal">
        <div className="bio-header">
          <div>
            <span className="bio-header-label">Enrollment Wizard</span>
            <h2>Biometric Credential Setup</h2>
          </div>
          <button className="bio-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="bio-steps">
          <div className="bio-step active">
            <div className="bio-step-circle">1</div>
            <span>Left Side Scan</span>
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
              <CheckCircle size={64} className="bio-success-icon" />
              <h3>Biometric Enrollment Successful</h3>
            </div>
          ) : (
            <>
              <Fingerprint size={96} className="bio-finger" />
              <p className="bio-instruct">
                {phase === 'scanning'
                  ? 'Scanning your fingerprint...'
                  : 'Place your finger on the scanner to begin the enrollment process.'}
              </p>

              <div className="bio-metrics">
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

              <div className="bio-status">
                <span className={`bio-status-dot ${phase === 'scanning' ? 'pulse' : ''}`} />
                <span>{phase === 'scanning' ? 'Scanning...' : 'Ready'}</span>
              </div>
            </>
          )}
        </div>

        {phase !== 'success' && (
          <div className="bio-info">
            <Info size={14} />
            Chronos infrastructure uses military-grade encryption. No raw biometric images are stored on our servers. Only hashed feature maps are generated.
          </div>
        )}

        <div className="bio-actions">
          {phase === 'success' ? (
            <button className="bio-cancel" onClick={handleClose}>Close</button>
          ) : (
            <>
              <button className="bio-cancel" onClick={handleClose}>Cancel</button>
              {phase === 'idle' && (
                <button className="bio-scan" onClick={handleBeginScan}>
                  <ScanLine size={16} />
                  Begin Scan
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
