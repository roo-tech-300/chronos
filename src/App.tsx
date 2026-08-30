import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './LandingPage'
import LoginPage from './LoginPage'
import SignUpPage from './SignUpPage'
import OrgHubPage from './OrgHubPage'
import DashboardPage from './DashboardPage'
import StaffRosterPage from './StaffRosterPage'
import StaffProfilePage from './StaffProfilePage'
import DevicesPage from './DevicesPage'
import AnalyticsPage from './AnalyticsPage'
import OrgSettingsPage from './OrgSettingsPage'
import TasksPage from './TasksPage'
import MyTasksPage from './MyTasksPage'
import TerminalPairPage from './TerminalPairPage'
import KioskScanPage from './KioskScanPage'
import { AuthProvider } from './context/AuthContext'
import { DevPersonaProvider, useDevPersona } from './context/DevPersonaContext'
import { WorkspaceProvider } from './context/WorkspaceContext'
import DevPersonaSwitcher from './components/common/DevPersonaSwitcher'
import GlobalScanNotificationToast from './components/common/GlobalScanNotificationToast'

// Staff members (non-leadership) are routed straight to their Daily Workspace;
// department heads & admins keep the Dashboard as their primary landing page.
function StaffGuardedDashboard() {
  const { role } = useDevPersona()
  if (role === 'staff') return <Navigate to="/tasks/my-tasks" replace />
  return <DashboardPage />
}

function App() {
  return (
    <AuthProvider>
      <DevPersonaProvider>
        <WorkspaceProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/workspaces" element={<OrgHubPage />} />

            {/* Workspace-Scoped Routes */}
            <Route path="/workspace/staff" element={<StaffRosterPage />} />
            <Route path="/workspace/staff/:staffId" element={<StaffProfilePage />} />
            <Route path="/workspace/:workspaceId" element={<StaffGuardedDashboard />} />
            <Route path="/workspace/:workspaceId/dashboard" element={<StaffGuardedDashboard />} />
            <Route path="/workspace/:workspaceId/staff" element={<StaffRosterPage />} />
            <Route path="/workspace/:workspaceId/staff/:staffId" element={<StaffProfilePage />} />
            <Route path="/workspace/:workspaceId/devices" element={<DevicesPage />} />
            <Route path="/workspace/:workspaceId/analytics" element={<AnalyticsPage />} />
            <Route path="/workspace/:workspaceId/settings" element={<OrgSettingsPage />} />
            <Route path="/workspace/:workspaceId/settings/organization" element={<OrgSettingsPage />} />
            <Route path="/workspace/:workspaceId/tasks" element={<TasksPage />} />
            <Route path="/workspace/:workspaceId/tasks/my-tasks" element={<MyTasksPage />} />

            {/* Legacy & Direct Default Routes */}
            <Route path="/dashboard" element={<StaffGuardedDashboard />} />
            <Route path="/staff" element={<StaffRosterPage />} />
            <Route path="/staff/:staffId" element={<StaffProfilePage />} />
            <Route path="/devices" element={<DevicesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings/organization" element={<OrgSettingsPage />} />
            <Route path="/settings/organisation" element={<OrgSettingsPage />} />
            <Route path="/setting/organisation" element={<OrgSettingsPage />} />
            <Route path="/settings" element={<OrgSettingsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tasks/my-tasks" element={<MyTasksPage />} />

            {/* Hardware Kiosk & Terminal Routes */}
            <Route path="/terminal/pair" element={<TerminalPairPage />} />
            <Route path="/scan" element={<KioskScanPage />} />
          </Routes>
          <GlobalScanNotificationToast />
          <DevPersonaSwitcher />
        </WorkspaceProvider>
      </DevPersonaProvider>
    </AuthProvider>
  )
}

export default App

