import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getInitials } from './dummy/roster-mock'
import { useAuth } from './context/useAuth'
import { useWorkspace } from './context/useWorkspace'
import { useStaffProfile } from './hooks/useStaffProfile'
import BiometricEnrollmentModal from './BiometricEnrollmentModal'
import AppNavbar from './components/layout/AppNavbar'
import StaffOverviewCard from './components/profile/StaffOverviewCard'
import { Badge } from './components/ui'
import './styles/profile-page.css'
import './styles/profile-card.css'

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
            <StaffOverviewCard
              activities={profile?.activities}
              onEnrollFingerprint={() => setEnrollOpen(true)}
              onEditDetails={() => {}}
              onDownloadLog={() => {}}
            />
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
