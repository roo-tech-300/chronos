import { useState } from 'react'
import { Plus, ChevronRight } from 'lucide-react'
import { devices, deviceMetrics } from './dummy/devices-mock'
import AppNavbar from './components/layout/AppNavbar'
import { Button, Badge, Toolbar } from './components/ui'
import './styles/devices-page.css'
import './styles/devices-card.css'

export default function DevicesPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = devices.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success'
      case 'idle':
        return 'neutral'
      case 'disconnected':
        return 'danger'
      default:
        return 'neutral'
    }
  }

  return (
    <div className="dev-page">
      <AppNavbar />

      <main className="dev-main">
        <div className="dev-header">
          <div className="dev-header-left">
            <h1>Devices</h1>
            <p>Manage and monitor hardware terminal stations across the campus.</p>
          </div>
        </div>

        <Toolbar
          className="mb-6"
          search={{
            placeholder: 'Search by station name or location...',
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            onClear: () => setSearchQuery(''),
            width: 'w-full sm:w-80 md:w-96',
          }}
          primaryAction={
            <Button
              variant="primary"
              leftIcon={<Plus size={18} />}
            >
              Pair New Station
            </Button>
          }
        />

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
                <Badge
                  variant={getStatusVariant(d.status)}
                  showDot
                  pulseDot={d.status.toLowerCase() === 'active'}
                >
                  {d.status}
                </Badge>
              </div>
              <p className="dev-card-location">{d.location}</p>
              <div className="dev-card-meta">
                <div>
                  <span className="dev-card-meta-label">{d.latency ? 'Latency' : 'Alert'}</span>
                  <div className={d.latency ? 'dev-card-meta-value' : 'dev-card-meta-value alert'}>
                    {d.latency ?? d.alert}
                  </div>
                </div>
                <button className="dev-card-action" aria-label="View station details">
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

