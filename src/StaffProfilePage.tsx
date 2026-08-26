import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Fingerprint, Key, Shield, History,
  ArrowLeft, Pencil,
  Server, Building2, Building, LogOut, DoorOpen,
} from 'lucide-react'
import { getInitials } from './dummy/roster-mock'
import { useAuth } from './context/useAuth'
import { useWorkspace } from './context/useWorkspace'
import { useStaffProfile } from './hooks/useStaffProfile'
import BiometricEnrollmentModal from './BiometricEnrollmentModal'
import AppNavbar from './components/layout/AppNavbar'
import { Button, Badge } from './components/ui'
import type { ScanActivity } from './dummy/profile-mock'
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
  const { workspaceId, staffId } = useParams<{ workspaceId?: string; staffId: string }>()
  const { profile: authProfile } = useAuth()
  const { accentColor } = useWorkspace()
  const [enrollOpen, setEnrollOpen] = useState(false)

  const { data: profile, isLoading } = useStaffProfile(staffId, workspaceId)

  const backLink = workspaceId ? `/workspace/${workspaceId}/staff` : '/staff'

  const displayName = profile?.name || authProfile?.fullName || 'Staff Member'
  const displayStaffCode = profile?.staffId || (staffId?.startsWith('CHR-') ? staffId : 'CHR-0001')
  const displayAvatar = profile?.avatarUrl || authProfile?.avatarUrl

  return (
    <div
      className="profile-page"
      style={
        {
          '--prof-primary': accentColor,
        } as React.CSSProperties
      }
    >
      <AppNavbar />

      <main className="profile-main">
        <Link to={backLink} className="profile-back">
          <ArrowLeft size={18} />
          Back to Roster
        </Link>

        <div className="profile-grid">
          <div className="profile-col-left">
            <div className="prof-card">
              <div className="prof-card-body">
                <div className="prof-avatar">
                  <div className="prof-avatar-inner overflow-hidden">
                    {displayAvatar ? (
                      <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{getInitials(displayName)}</span>
                    )}
                  </div>
                </div>
                <div className="prof-info">
                  <h1>{isLoading ? 'Loading profile...' : displayName}</h1>
                  <p className="prof-id">Staff ID: {displayStaffCode}</p>
                </div>
                <Badge variant="purple" size="md">{profile?.role || 'Administrator'}</Badge>
              </div>
            </div>
          </div>

          <div className="profile-col-right">
            <div className="prof-gov-card">
              <div className="prof-gov-header">
                <h2>Staff Governance Profile</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Fingerprint size={16} />}
                    onClick={() => setEnrollOpen(true)}
                  >
                    Enroll Fingerprint
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Pencil size={16} />}
                  >
                    Edit Details
                  </Button>
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
                        <span className="prof-perm-level">{profile?.accessLevel || '05'}</span>
                      </div>
                      <div className="prof-perm-icon-wrap">
                        <Shield size={24} />
                      </div>
                    </div>
                    <div className="prof-perm-card">
                      <span className="prof-perm-label">Auth Protocols</span>
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        {(profile?.authProtocols || ['BIOMETRIC_OVERRIDE', 'MFA_ENABLED', 'PHYSICAL_KEY']).map((p) => (
                          <Badge key={p} variant="neutral" size="sm">{p}</Badge>
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
                    <Button variant="outline" size="sm">Download Log</Button>
                  </div>
                  <div className="prof-activity-list">
                    {(profile?.activities || [
                      { terminal: 'Main Gate - Arrival', action: 'Biometric Entry', time: '08:12 AM' },
                      { terminal: 'Terminal 04 - East Wing', action: 'Workspace Synchronized', time: 'Just now' },
                    ]).map((act) => (
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
