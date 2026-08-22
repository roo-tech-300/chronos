import { Routes, Route } from 'react-router-dom'
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
import { DevPersonaProvider } from './context/DevPersonaContext'
import DevPersonaSwitcher from './components/common/DevPersonaSwitcher'

function App() {
  return (
    <DevPersonaProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/workspaces" element={<OrgHubPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/staff" element={<StaffRosterPage />} />
        <Route path="/staff/:staffId" element={<StaffProfilePage />} />
        <Route path="/devices" element={<DevicesPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings/organization" element={<OrgSettingsPage />} />
        <Route path="/settings/organisation" element={<OrgSettingsPage />} />
        <Route path="/setting/organisation" element={<OrgSettingsPage />} />
        <Route path="/settings" element={<OrgSettingsPage />} />
        <Route path="/tasks" element={<TasksPage />} />
      </Routes>
      <DevPersonaSwitcher />
    </DevPersonaProvider>
  )
}

export default App
