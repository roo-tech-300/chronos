import { Link } from 'react-router-dom'
import { Bell, Settings, TrendingUp } from 'lucide-react'
import nataleLogo from './assets/companies/natale.png'
import { metrics, chartHeights, chartLabels, headcountMembers } from './dummy/staff-mock'
import './styles/dashboard-layout.css'
import './styles/dashboard-widgets.css'

const tooltipValues = ['1,284', '2,441', '1,204', '5,087', '4,211', '2,108', '3,845', '2,923', '6,018', '1,798', '1,044', '3,442']

export default function DashboardPage() {
  return (
    <div className="dash-page">
      <nav className="dash-nav">
        <div className="dash-nav-inner">
          <div className="dash-nav-left">
            <Link to="/" className="dash-nav-brand">
              <img src={nataleLogo} alt="Natale" className="dash-nav-logo" />
              Natale
            </Link>
            <div className="dash-nav-links">
              <a href="#" className="active">Dashboard</a>
              <Link to="/staff">Staff</Link>
              <Link to="/devices">Devices</Link>
              <Link to="/analytics">Analytics</Link>
            </div>
          </div>
          <div className="dash-nav-right">
            <button className="dash-nav-btn" title="Notifications"><Bell size={20} /></button>
            <Link to="/settings/organization" className="dash-nav-btn" title="Settings"><Settings size={20} /></Link>
            <div className="dash-avatar">AK</div>
          </div>
        </div>
      </nav>

      <main className="dash-main">
        <div className="dash-grid">
          <div className="dash-main-col">
            <div className="dash-metrics">
              {metrics.map((m) => (
                <div key={m.label} className="dash-card dash-metric">
                  <div className="dash-metric-top">
                    <span className="dash-metric-label">{m.label}</span>
                    <span className={`dash-metric-badge ${m.badgeVariant}`}>{m.badge}</span>
                  </div>
                  <div className="dash-metric-value">{m.value}</div>
                  <div className="dash-metric-desc">{m.description}</div>
                </div>
              ))}
            </div>

            <div className="dash-card dash-chart-card">
              <div className="dash-section-header">
                <div>
                  <h2>Daily Attendance Volume</h2>
                  <p>Last 14 days aggregated by day</p>
                </div>
                <div className="dash-chart-tabs">
                  <button className="dash-chart-tab">Day</button>
                  <button className="dash-chart-tab active">Week</button>
                  <button className="dash-chart-tab">Month</button>
                </div>
              </div>
              <div className="dash-chart-body">
                <div className="dash-chart-bars">
                  {chartHeights.map((h, i) => (
                    <div
                      key={i}
                      className={`dash-chart-bar ${h > 80 ? 'peak' : 'normal'}`}
                      style={{ height: `${h}%` }}
                    >
                      <span className="tooltip">{tooltipValues[i]}</span>
                    </div>
                  ))}
                </div>
                <div className="dash-chart-labels">
                  {chartLabels.map((d) => <span key={d}>{d}</span>)}
                </div>
              </div>
            </div>

            <div className="dash-kiosk">
              <h3>Launch Attendance Kiosk</h3>
              <p>Turn this computer into a physical check-in station.</p>
              <div className="dash-kiosk-bottom">
                <div>
                  <div className="dash-kiosk-status-label">System Status</div>
                  <div className="dash-kiosk-status">
                    <span className="dash-kiosk-dot" />
                    Nodes Ready
                  </div>
                </div>
                <button className="dash-kiosk-btn">
                  Open Kiosk Screen
                </button>
              </div>
              <TrendingUp size={256} className="dash-kiosk-icon" />
            </div>
          </div>

          <div className="dash-side-col">
            <div className="dash-headcard">
              <div className="dash-headcard-header">
                <h3>Live Headcount</h3>
                <span className="dash-headcard-live">
                  <span className="dot" />
                  LIVE
                </span>
              </div>
              <p className="dash-headcard-count">{headcountMembers.length} Staff Members On-Site</p>
              <div className="dash-headcard-list">
                {headcountMembers.map((s) => (
                  <div key={s.name} className="dash-headcard-row">
                    <div className="dash-headcard-avatar">{s.initials}</div>
                    <div className="dash-headcard-info">
                      <div className="dash-headcard-name">
                        <span>{s.name}</span>
                        <span className="time">{s.time}</span>
                      </div>
                      <div className="dash-headcard-terminal">{s.terminal}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="dash-headcard-footer">
                <div className="dash-headcard-total">
                  <span>Total in building</span>
                  <span>1,842</span>
                </div>
                <div className="dash-headcard-bar">
                  <div className="dash-headcard-bar-fill" style={{ width: '65%' }} />
                </div>
                <p className="dash-headcard-occupancy">
                  Building occupancy is at 65%
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="dash-footer">
        <div className="dash-footer-inner">
          <div className="dash-footer-left">
            <div className="dash-footer-label">Natale Identity</div>
            <p className="dash-footer-copy">&copy; 2025 Natale Identity Corp. All rights reserved.</p>
          </div>
          <div className="dash-footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">API Documentation</a>
            <a href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
