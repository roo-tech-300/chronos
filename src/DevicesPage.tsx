import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Bell, Settings, ChevronRight } from 'lucide-react'
import nataleLogo from './assets/companies/natale.png'
import { devices, deviceMetrics } from './dummy/devices-mock'
import './styles/devices-page.css'
import './styles/devices-card.css'

export default function DevicesPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = devices.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="dev-page">
      <nav className="dev-nav">
        <div className="dev-nav-inner">
          <div className="dev-nav-left">
            <Link to="/" className="dev-nav-brand">
              <img src={nataleLogo} alt="Natale" className="dev-nav-logo" />
              Natale
            </Link>
            <div className="dev-nav-links">
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/staff">Staff</Link>
              <Link to="/devices" className="active">Devices</Link>
              <Link to="/analytics">Analytics</Link>
            </div>
          </div>
          <div className="dev-nav-right">
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: '#52424e' }} title="Notifications"><Bell size={20} /></button>
            <Link to="/settings/organization" style={{ color: '#52424e', display: 'flex', padding: 4 }} title="Settings"><Settings size={20} /></Link>
            <div className="roster-nav-avatar" style={{ width: 32, height: 32, borderRadius: '50%', background: '#edeeef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#52424e', border: '1px solid #e5e7eb' }}>AK</div>
          </div>
        </div>
      </nav>

      <main className="dev-main">
        <div className="dev-header">
          <div className="dev-header-left">
            <h1>Devices</h1>
            <p>Manage and monitor hardware terminal stations across the campus.</p>
          </div>
          <button className="dev-pair-btn">
            <Plus size={18} />
            Pair New Station
          </button>
        </div>

        <div className="dev-search">
          <Search size={16} color="#a1a1aa" />
          <input
            placeholder="Search by station name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="dev-metrics">
          <div className="dev-metric-card">
            <div className="dev-metric-value">{deviceMetrics.total}</div>
            <div className="dev-metric-label">Total Registered Stations</div>
          </div>
          <div className="dev-metric-card">
            <div className="dev-metric-value">{deviceMetrics.active}</div>
            <div className="dev-metric-label">Active Stations Online</div>
          </div>
          <div className="dev-metric-card">
            <div className="dev-metric-value">{deviceMetrics.disconnected}</div>
            <div className="dev-metric-label">Disconnected Alerts</div>
          </div>
        </div>

        <div className="dev-grid">
          {filtered.map((d) => (
            <div key={d.id} className={`dev-card ${d.status.toLowerCase()}`}>
              <div className="dev-card-top">
                <p className="dev-card-name">{d.name}</p>
                <span className={`dev-card-status ${d.status.toLowerCase()}`}>
                  <span className={`dev-card-status-dot ${d.status.toLowerCase()}`} />
                  <span className={`dev-card-status-text ${d.status.toLowerCase()}`}>{d.status}</span>
                </span>
              </div>
              <p className="dev-card-location">{d.location}</p>
              <div className="dev-card-meta">
                <div>
                  <span className="dev-card-meta-label">{d.latency ? 'Latency' : 'Alert'}</span>
                  <div className={d.latency ? 'dev-card-meta-value' : 'dev-card-meta-value alert'}>
                    {d.latency ?? d.alert}
                  </div>
                </div>
                <button className="dev-card-action">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="dev-infra">
          <div className="dev-infra-text">
            <p>Monitoring identity infrastructure security across all 128 registered terminal stations. Low-latency biometric validation is currently operating at 99.98% efficiency.</p>
          </div>
          <div className="dev-infra-stats">
            <div className="dev-infra-stat">
              <span className="dev-infra-stat-value">128</span>
              <span className="dev-infra-stat-label">Secure Nodes</span>
            </div>
            <div className="dev-infra-stat">
              <span className="dev-infra-stat-value">14ms</span>
              <span className="dev-infra-stat-label">Avg Latency</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="dev-footer">
        <div className="dev-footer-inner">
          <div>
            <div className="dev-footer-label">Natale Identity</div>
            <p className="dev-footer-copy">&copy; 2025 Natale Identity Corp. All rights reserved.</p>
          </div>
          <div className="dev-footer-links">
            <a href="#">Security Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Compliance</a>
            <a href="#">Infrastructure Status</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
