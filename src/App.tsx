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

function App() {
  return (
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
    </Routes>
  )
}

export default App
