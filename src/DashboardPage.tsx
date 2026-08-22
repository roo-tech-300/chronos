import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { metrics, chartHeights, chartLabels, headcountMembers } from './dummy/staff-mock'
import AppNavbar from './components/layout/AppNavbar'
import { useDevPersona } from './context/DevPersonaContext'
import { Button, Badge, Tabs } from './components/ui'
import './styles/dashboard-layout.css'
import './styles/dashboard-widgets.css'

const tooltipValues = ['1,284', '2,441', '1,204', '5,087', '4,211', '2,108', '3,845', '2,923', '6,018', '1,798', '1,044', '3,442']

export default function DashboardPage() {
  const { role, currentDepartment } = useDevPersona()
  const [chartPeriod, setChartPeriod] = useState('Week')

  const displayMetrics = useMemo(() => {
    if (role === 'admin') return metrics
    return [
      {
        label: 'DEPT HEADCOUNT',
        value: '48',
        description: `Active personnel in ${currentDepartment.name}`,
        badge: '+2 this month',
        badgeVariant: 'green',
      },
      {
        label: 'DEPARTMENT ON-SITE',
        value: '36',
        description: '75.0% live departmental occupancy',
        badge: '75%',
        badgeVariant: 'neutral',
      },
      {
        label: 'SUB-UNITS READY',
        value: `${currentDepartment.subDepartments.length} / ${currentDepartment.subDepartments.length}`,
        description: currentDepartment.subDepartments.join(', '),
        badge: '100% Operational',
        badgeVariant: 'green',
      },
    ]
  }, [role, currentDepartment])

  const displayHeadcount = useMemo(() => {
    if (role === 'admin') return headcountMembers
    return headcountMembers.slice(0, 3)
  }, [role])

  return (
    <div className="dash-page">
      <AppNavbar />

      <main className="dash-main">
        <div className="dash-grid">
          <div className="dash-main-col">
            <div className="dash-metrics">
              {displayMetrics.map((m) => (
                <div key={m.label} className="dash-card dash-metric">
                  <div className="dash-metric-top">
                    <span className="dash-metric-label">{m.label}</span>
                    <Badge variant={m.badgeVariant === 'green' ? 'success' : 'neutral'} size="sm">
                      {m.badge}
                    </Badge>
                  </div>
                  <div className="dash-metric-value">{m.value}</div>
                  <div className="dash-metric-desc">{m.description}</div>
                </div>
              ))}
            </div>

            <div className="dash-card dash-chart-card">
              <div className="dash-section-header">
                <div>
                  <h2>
                    {role === 'admin'
                      ? 'Daily Attendance Volume'
                      : `${currentDepartment.name} Attendance Volume`}
                  </h2>
                  <p>Last 14 days aggregated by day {role === 'hod' ? '• Department Scope' : ''}</p>
                </div>
                <Tabs
                  tabs={['Day', 'Week', 'Month']}
                  activeTab={chartPeriod}
                  onChange={setChartPeriod}
                  variant="segmented"
                />
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
                <Link to="/scan">
                  <Button variant="primary">
                    Open Kiosk Screen
                  </Button>
                </Link>
              </div>
              <TrendingUp size={256} className="dash-kiosk-icon" />
            </div>
          </div>

          <div className="dash-side-col">
            <div className="dash-headcard">
              <div className="dash-headcard-header">
                <h3>Live Headcount</h3>
                <Badge variant="danger" showDot pulseDot size="sm">
                  LIVE
                </Badge>
              </div>
              <p className="dash-headcard-count">
                {role === 'admin' ? `${headcountMembers.length} Staff Members On-Site` : '36 Department Members On-Site'}
              </p>
              <div className="dash-headcard-list">
                {displayHeadcount.map((s) => (
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
                  <span>{role === 'admin' ? 'Total in building' : 'Dept on-site'}</span>
                  <span>{role === 'admin' ? '1,842' : '36 / 48'}</span>
                </div>
                <div className="dash-headcard-bar">
                  <div className="dash-headcard-bar-fill" style={{ width: role === 'admin' ? '65%' : '75%' }} />
                </div>
                <p className="dash-headcard-occupancy">
                  {role === 'admin' ? 'Building occupancy is at 65%' : `${currentDepartment.name} occupancy is at 75%`}
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


