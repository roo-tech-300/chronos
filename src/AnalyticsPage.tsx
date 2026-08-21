import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, MoreVertical, X, Bell } from 'lucide-react'
import nataleLogo from './assets/companies/natale.png'
import { analyticsEntries } from './dummy/analytics-mock'
import './styles/analytics-page.css'
import './styles/analytics-table.css'
import './styles/analytics-modal.css'

export default function AnalyticsPage() {
  const [exportOpen, setExportOpen] = useState(false)
  const [format, setFormat] = useState<'excel' | 'csv'>('excel')

  return (
    <div className="an-page">
      <nav className="an-nav">
        <div className="an-nav-inner">
          <div className="an-nav-left">
            <Link to="/" className="an-nav-brand">
              <img src={nataleLogo} alt="Natale" className="an-nav-logo" />
              Natale
            </Link>
            <div className="an-nav-links">
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/staff">Staff</Link>
              <Link to="/devices">Devices</Link>
              <Link to="/analytics" className="active">Analytics</Link>
            </div>
          </div>
          <div className="an-nav-right">
            <Bell size={20} color="#52424e" />
            <div className="roster-nav-avatar" style={{ width: 32, height: 32, borderRadius: '50%', background: '#edeeef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#52424e', border: '1px solid #e5e7eb' }}>AK</div>
          </div>
        </div>
      </nav>

      <main className="an-main">
        <div className="an-header">
          <h1>Analytics</h1>
          <p>Review, verify, and export past attendance logs and sign-in timelines.</p>
        </div>

        <div className="an-toolbar">
          <button className="an-export-btn" onClick={() => setExportOpen(true)}>
            <Download size={16} />
            Export to Spreadsheet
          </button>
          <select className="an-filter-select">
            <option>This Week</option>
            <option>This Month</option>
            <option>Last Month</option>
          </select>
          <select className="an-filter-select">
            <option>All Departments</option>
            <option>Security Operations</option>
            <option>Core Infrastructure</option>
            <option>Deep Tech Lab</option>
          </select>
          <select className="an-filter-select">
            <option>All Roles</option>
            <option>Administrator</option>
            <option>Staff</option>
          </select>
        </div>

        <div className="an-info-bar">Showing 1,284 entries for current filters</div>

        <div className="an-table-wrap">
          <table className="an-table">
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>Staff ID</th>
                <th>Staff Name / Dept</th>
                <th>Log Type</th>
                <th>Station ID</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {analyticsEntries.map((e, i) => (
                <tr key={i}>
                  <td>
                    <div>{e.date}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{e.time}</div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{e.staffId}</td>
                  <td>
                    <div className="an-cell-staff">
                      <span className="an-staff-name">{e.staffName}</span>
                      <span className="an-staff-dept">{e.department}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`an-log-badge ${e.logType.toLowerCase().replace('-', '')}`}>
                      <span className={`an-log-dot ${e.logType.toLowerCase().replace('-', '')}`} />
                      {e.logType}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>{e.stationId}</td>
                  <td>
                    <button className="an-action-btn">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="an-pagination">
            <span className="an-pagination-info">Showing 1 to 5 of 1,284 entries</span>
            <div className="an-pagination-actions">
              <button className="an-page-btn" disabled>Previous</button>
              <button className="an-page-btn">Next</button>
            </div>
          </div>
        </div>
      </main>

      {exportOpen && (
        <div className="an-modal-overlay" onClick={() => setExportOpen(false)}>
          <div className="an-modal" onClick={(e) => e.stopPropagation()}>
            <button className="an-modal-close" onClick={() => setExportOpen(false)}>
              <X size={18} />
            </button>
            <h2>Export Historical Ledger</h2>
            <p className="an-modal-sub">Generate audit-ready documentation</p>

            <div className="an-format-group">
              <button className={`an-format-option ${format === 'excel' ? 'selected' : ''}`} onClick={() => setFormat('excel')}>
                <div className="an-format-icon">Excel Worksheet</div>
                <div className="an-format-desc">Best for analysis</div>
              </button>
              <button className={`an-format-option ${format === 'csv' ? 'selected' : ''}`} onClick={() => setFormat('csv')}>
                <div className="an-format-icon">CSV Data Flatfile</div>
                <div className="an-format-desc">Best for importing</div>
              </button>
            </div>

            <div className="an-check-group">
              <label className="an-check-label">
                <input type="checkbox" defaultChecked />
                Group by Department
              </label>
              <label className="an-check-label">
                <input type="checkbox" />
                Include Device Metadata
              </label>
            </div>

            <div className="an-modal-disclaimer">
              <span>By downloading this ledger, you agree to handle this PII in accordance with the Chronos Security Policy and local data protection regulations.</span>
            </div>

            <div className="an-modal-actions">
              <button className="an-modal-cancel" onClick={() => setExportOpen(false)}>Cancel</button>
              <button className="an-modal-download">
                <Download size={16} />
                Download Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="an-footer">
        <div className="an-footer-inner">
          <div>
            <div className="an-footer-label">Natale Identity</div>
            <p className="an-footer-copy">&copy; 2025 Natale Identity Corp. All rights reserved.</p>
          </div>
          <div className="an-footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Security Whitepaper</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
