import { Link } from 'react-router-dom'
import { PlusCircle, Search, SlidersHorizontal, Plus, Bell, ChevronDown } from 'lucide-react'
import { workspaces } from './dummy/org-hub-mock'
import futminnaLogo from './assets/logo.jpg'
import kangarooLogo from './assets/companies/KangarooTech.png'
import nataleLogo from './assets/companies/natale.png'
import logoImg from './assets/logo.png'
import './styles/org-hub-nav.css'
import './styles/org-hub-grid.css'
import './styles/org-hub-foot.css'

const logoMap: Record<string, string> = {
  futminna: futminnaLogo,
  kangaroo: kangarooLogo,
  natale: nataleLogo,
}

export default function OrgHubPage() {
  return (
    <div className="org-page">
      <header className="org-navbar">
        <div className="org-navbar-inner">
          <div className="org-nav-left">
            <Link to="/" className="org-nav-brand">
              <img src={logoImg} alt="Chronos" className="org-nav-logo" />
              <span>Chronos</span>
            </Link>
            <nav className="org-nav-links">
              <a href="#" className="active">Workspaces</a>
              <a href="#">Explore</a>
              <a href="#">Architecture</a>
              <a href="#">Support</a>
            </nav>
          </div>
          <div className="org-nav-right">
            <button className="org-btn-new">
              <Plus size={20} />
              <span>New Workspace</span>
            </button>
            <div className="org-nav-divider" />
            <button className="org-nav-icon-btn">
              <Bell size={20} />
            </button>
            <div style={{display:'flex', alignItems:'center', gap:'12px', paddingLeft:'8px'}}>
              <div className="org-nav-avatar">JD</div>
              <ChevronDown size={16} style={{color:'var(--oh-on-surface-variant)'}} />
            </div>
          </div>
        </div>
      </header>

      <main className="org-content">
        <div className="org-hero">
          <div className="org-hero-top">
            <div>
              <h2>Select Workspace</h2>
              <p>Choose an organization to continue or create a new one to start managing physical identities and security infrastructure.</p>
            </div>
            <div className="org-hero-actions">
              <div className="org-search-wrap">
                <span className="org-search-icon"><Search size={16} /></span>
                <input type="text" placeholder="Search workspaces..." />
              </div>
              <button className="org-filter-btn">
                <SlidersHorizontal size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="org-grid">
          {workspaces.map((ws) => (
            <div key={ws.id} className="org-card">
              <div>
                <div className="org-card-header">
                  <div className={'org-card-icon ' + (ws.role === 'Member' ? 'gray' : 'purple')}>
                    <img src={logoMap[ws.logoId]} alt={ws.name} className="org-card-logo" />
                  </div>
                  <span className={'org-badge ' + (ws.role === 'Member' ? 'gray' : 'purple')}>
                    {ws.role}
                  </span>
                </div>
                <h3>{ws.name}</h3>
                <div className="org-card-meta">
                  <span>{ws.memberCount} Members</span>
                  <span className="dot" />
                  <span>{ws.category}</span>
                </div>
              </div>
              <div className="org-card-footer">
                <span className="last-active">{ws.lastActive}</span>
                <Link to="/dashboard" className="org-btn-select">Select</Link>
              </div>
            </div>
          ))}

          <div className="org-card-create">
            <div className="org-card-create-icon">
              <PlusCircle size={32} />
            </div>
            <div>
              <h3>New Workspace</h3>
              <p>Start a new project or onboard a new client organization.</p>
            </div>
          </div>
        </div>

        <div className="org-support">
          <p>
            Need help managing your workspaces? <a href="#">Contact Support</a>
          </p>
        </div>
      </main>

      <footer className="org-footer">
        <div className="org-footer-inner">
          <div className="org-footer-left">
            <span className="org-footer-version">CHRONOS CORE v2.4</span>
            <p className="org-footer-copy">&copy; 2024 Chronos Identity Infrastructure. All rights reserved.</p>
          </div>
          <div className="org-footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Security Architecture</a>
            <div className="org-footer-status">
              <span className="pulse-dot" />
              <a href="#">System Status</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
