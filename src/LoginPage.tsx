import { useState, useEffect, useRef, useCallback } from 'react'
import { Eye, EyeOff, KeyRound, ArrowRight } from 'lucide-react'
import './styles/login-base.css'
import './styles/login-aside.css'
import logoImg from './assets/logo.png'

interface StaffProfile {
  name: string
  code: string
  role: string
  company: string
}

const staffProfiles: StaffProfile[] = [
  { name: 'Eluzia Ameh-Ako', code: '8211', role: 'CEO', company: 'Kangaroo Technologies' },
  { name: 'Alive Theophilus', code: '7251', role: 'Chief Pharmacist', company: 'Sure Medical Services' },
  { name: 'Patrick Abiodun', code: '4926', role: 'Engineer', company: 'Apex Systems' },
  { name: 'Professor Faruk Adamu Kuta', code: '0001', role: 'Vice Chancellor', company: 'FUT Minna' },
]

export default function LoginPage() {
  const [profileIndex, setProfileIndex] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [cookieVisible, setCookieVisible] = useState(true)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setProfileIndex((prev) => (prev + 1) % staffProfiles.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({ x, y })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: 50, y: 50 })
  }, [])

  const profile = staffProfiles[profileIndex]
  const cx = mousePos.x
  const cy = mousePos.y

  return (
    <div className="login-page">
      <div className="login-form-panel">
        <div className="login-form-inner">
          <div className="login-form-main">
            <div className="login-logo">
              <img src={logoImg} alt="Chronos" className="login-logo-img" />
              <span>Chronos</span>
            </div>

            <h1 className="login-heading">Welcome back</h1>
            <p className="login-subtitle">Sign in to your existing account</p>

            <button className="social-btn">
              <span className="social-btn-left">
                <GoogleLogo />
                Continue with Google
              </span>
              <ArrowRight size={16} />
            </button>

            <button className="social-btn">
              <span className="social-btn-left">
                <KeyRound size={20} />
                Continue with SSO
              </span>
              <ArrowRight size={16} />
            </button>

            <div className="divider">OR CONTINUE WITH</div>

            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input id="email" type="email" placeholder="name@company.com" />
            </div>

            <div className="input-group">
              <div className="password-header">
                <label htmlFor="password">Password</label>
                <a href="#" className="forgot-link">Forgot Password?</a>
              </div>
              <div className="password-toggle">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button className="signin-btn">
              Sign In
              <ArrowRight size={18} />
            </button>

            <span className="request-link">
              Don't have an account? <a href="/signup">Create Account</a>
            </span>
          </div>

          <div className="login-footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms</a>
            <a href="#">Security</a>
          </div>
        </div>
      </div>

      <div
        className="login-brand-panel"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        ref={cardRef}
      >
        <div className="identity-card">
          <div
            className="card-shine"
            style={{
              background: 'radial-gradient(circle at ' + cx + '% ' + cy + '%, rgba(255,255,255,0.08) 0%, transparent 60%)',
            }}
          />
          <div className="identity-card-content">
            <div className="identity-fingerprint">
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{color:'rgba(255,255,255,0.5)'}}>
                <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
                <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
                <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
                <path d="M2 12a10 10 0 0 1 18-6" />
                <path d="M2 16h.01" />
                <path d="M21.8 16c.2-2 .13-3.35-.2-5" />
                <path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2" />
              </svg>
              <div className="scan-line" />
            </div>

            <div className="identity-fields" key={profileIndex}>
              <div className="identity-field">
                <span className="field-label">Name</span>
                <span className="field-value name">{profile.name}</span>
              </div>
              <div className="identity-field">
                <span className="field-label">Code</span>
                <span className="field-value">{profile.code}</span>
              </div>
              <div className="identity-field">
                <span className="field-label">Role</span>
                <span className="field-value">{profile.role}</span>
              </div>
              <div className="identity-field">
                <span className="field-label">Company</span>
                <span className="field-value">{profile.company}</span>
              </div>
            </div>

            <div className="identity-status">
              <span className="status-dot" />
              System Ready
            </div>
          </div>
        </div>
      </div>

      {cookieVisible && (
        <div className="cookie-banner">
          <p>
            We use cookies to enhance your experience. By continuing, you agree to our Privacy Policy.
          </p>
          <button className="cookie-btn accept" onClick={() => setCookieVisible(false)}>
            Accept
          </button>
          <button className="cookie-btn reject" onClick={() => setCookieVisible(false)}>
            Reject
          </button>
        </div>
      )}
    </div>
  )
}

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}
