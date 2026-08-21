import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Fingerprint, Key, Shield, History,
  ArrowLeft, Pencil,     Bell, Settings,
  Server, Building2, Building, LogOut, DoorOpen,
} from 'lucide-react'
import nataleLogo from './assets/companies/natale.png'
import { getProfile, type ScanActivity } from './dummy/profile-mock'
import BiometricEnrollmentModal from './BiometricEnrollmentModal'
import './styles/profile-page.css'
import './styles/profile-card.css'
import './styles/profile-gov.css'
import './styles/profile-activity.css'

const actIcon: Record<string, React.ReactNode> = {
  'Terminal 04 - East Wing': <DoorOpen size={20} />,
  'Server Room B': <Server size={20} />,
  'Boardroom North': <Building2 size={20} />,
  'Main Gate - Arrival': <Building size={20} />,
  'Main Gate - Departure': <LogOut size={20} />,
}

function acIcon(act: ScanActivity) {
  return actIcon[act.terminal] ?? <Shield size={20} />
}

export default function StaffProfilePage() {
  const { staffId } = useParams<{ staffId: string }>()
  const profile = getProfile(staffId ?? '')
  const [enrollOpen, setEnrollOpen] = useState(false)

  return (
    <div className="profile-page">
      <nav className="profile-nav">
        <div className="profile-nav-inner">
          <div className="profile-nav-left">
            <Link to="/" className="profile-nav-brand">
              <img src={nataleLogo} alt="Natale" className="profile-nav-logo" />
              Natale
            </Link>
            <div className="profile-nav-links">
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/staff" className="active">Staff</Link>
              <Link to="/devices">Devices</Link>
              <Link to="/analytics">Analytics</Link>
            </div>
          </div>
          <div className="profile-nav-right">
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: '#52424e' }} title="Notifications"><Bell size={20} /></button>
            <Link to="/settings/organization" style={{ color: '#52424e', display: 'flex', padding: 4 }} title="Settings"><Settings size={20} /></Link>
            <div className="profile-nav-avatar">AK</div>
          </div>
        </div>
      </nav>

      <main className="profile-main">
        <Link to="/staff" className="profile-back">
          <ArrowLeft size={18} />
          Back to Roster
        </Link>

        <div className="profile-grid">
          <div className="profile-col-left">
            <div className="prof-card">
              <div className="prof-card-bg-icon">
                <Fingerprint size={120} />
              </div>
              <div className="prof-card-body">
                <div className="prof-avatar">
                  <div className="prof-avatar-inner">
                    <span>{profile.name.split(' ').map((n) => n[0]).join('')}</span>
                  </div>
                </div>
                <div className="prof-info">
                  <h1>{profile.name}</h1>
                  <p className="prof-id">Staff ID: {profile.staffId}</p>
                </div>
                <div className="prof-role-badge">{profile.role}</div>
              </div>
              <div className="prof-divider" />
              <div className="prof-stats-grid">
                <div className="prof-stat-item">
                  <span className="prof-stat-label">Status</span>
                  <div className="prof-stat-row">
                    <span className="dot-green" />
                    <span>{profile.status}</span>
                  </div>
                </div>
                <div className="prof-stat-item">
                  <span className="prof-stat-label">Last Sync</span>
                  <span>{profile.lastSync}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-col-right">
            <div className="prof-gov-card">
              <div className="prof-gov-header">
                <h2>Staff Governance Profile</h2>
                <div className="prof-header-actions">
                  <button className="prof-enroll-btn" onClick={() => setEnrollOpen(true)}>
                    <Fingerprint size={16} />
                    Enroll Fingerprint
                  </button>
                  <button className="prof-edit-btn">
                    <Pencil size={16} />
                    Edit Details
                  </button>
                </div>
              </div>

              <div className="prof-gov-body">
                <div className="prof-section">
                  <h3 className="prof-section-title">
                    <Key size={16} />
                    System Permissions
                  </h3>
                  <div className="prof-perms-grid">
                    <div className="prof-perm-card">
                      <div className="prof-perm-info">
                        <span className="prof-perm-label">Access Level</span>
                        <span className="prof-perm-level">{profile.accessLevel}</span>
                      </div>
                      <div className="prof-perm-icon-wrap">
                        <Shield size={24} />
                      </div>
                    </div>
                    <div className="prof-perm-card">
                      <span className="prof-perm-label">Auth Protocols</span>
                      <div className="prof-protos">
                        {profile.authProtocols.map((p) => (
                          <span key={p} className="prof-proto-badge">{p}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="prof-section">
                  <div className="prof-activity-header">
                    <h3 className="prof-section-title">
                      <History size={16} />
                      Recent Scan Activity
                    </h3>
                    <button className="prof-dl-btn">Download Log</button>
                  </div>
                  <div className="prof-activity-list">
                    {profile.activities.map((act) => (
                      <div key={act.time} className="prof-activity-row">
                        <div className="prof-activity-left">
                          <div className="prof-activity-circle">{acIcon(act)}</div>
                          <div>
                            <p className="prof-activity-terminal">{act.terminal}</p>
                            <p className="prof-activity-action">{act.action}</p>
                          </div>
                        </div>
                        <span className="prof-activity-time">{act.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <BiometricEnrollmentModal open={enrollOpen} onClose={() => setEnrollOpen(false)} />

      <footer className="profile-footer">
        <div className="profile-footer-inner">
          <div>
            <div className="profile-footer-label">Natale Identity</div>
            <p className="profile-footer-copy">&copy; 2025 Natale Identity Corp. All rights reserved.</p>
          </div>
          <div className="profile-footer-links">
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
