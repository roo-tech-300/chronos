import { Link } from 'react-router-dom'
import { Bolt, Fingerprint, Check } from 'lucide-react'
import { content } from '../../data/landing-content'

export default function Hero() {
  const { hero } = content

  return (
    <section className="hero-section">
      <span className="hero-badge">
        <Bolt size={14} />
        {hero.badge}
      </span>

      <h1 className="hero-title">{hero.title}</h1>
      <p className="hero-subtitle">{hero.subtitle}</p>

      <div className="hero-actions">
        <Link to="/login" className="btn btn-primary btn-lg">{hero.primaryCta}</Link>
        <button className="btn btn-outline btn-lg">{hero.secondaryCta}</button>
      </div>

      <div className="terminal-mockup">
        <div className="terminal-header">
          <span className="terminal-dot red" />
          <span className="terminal-dot yellow" />
          <span className="terminal-dot green" />
          <span className="terminal-title">Secure Terminal v2.1</span>
        </div>
        <div className="terminal-body">
          <div className="terminal-status">
            <div className="terminal-fingerprint">
              <Fingerprint size={28} />
            </div>
            <span className="terminal-label">Waiting for interaction</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
              Place finger on scanner to verify
            </span>
            <div className="terminal-success">
              <Check size={18} />
              Access Granted
            </div>
            <div className="terminal-user">
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>
                Eluzia J.
              </span>
              <span>Authenticated</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
