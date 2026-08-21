import { Link } from 'react-router-dom'
import { Bell, Settings } from 'lucide-react'
import nataleLogo from '../../assets/companies/natale.png'

export default function SettingsNav() {
  return (
    <nav className="settings-nav">
      <div className="settings-nav-inner">
        <div className="settings-nav-left">
          <Link to="/" className="settings-nav-brand">
            <img src={nataleLogo} alt="Natale" className="settings-nav-logo" />
            Natale
          </Link>
          <div className="settings-nav-links">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/staff">Staff</Link>
            <Link to="/devices">Devices</Link>
            <Link to="/analytics">Analytics</Link>
          </div>
        </div>
        <div className="settings-nav-right">
          <button className="settings-nav-btn" title="Notifications">
            <Bell size={20} />
          </button>
          <Link to="/settings/organization" className="settings-nav-btn active" title="Organization Settings">
            <Settings size={20} />
          </Link>
          <div className="settings-avatar">AK</div>
        </div>
      </div>
    </nav>
  )
}
