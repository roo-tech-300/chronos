import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, ChevronLeft, ChevronRight, MoreVertical, Bell, Settings } from 'lucide-react'
import nataleLogo from './assets/companies/natale.png'
import { rosterMembers, filterTabs, getInitials } from './dummy/roster-mock'
import { slugify } from './dummy/profile-mock'
import StaffRosterModal from './StaffRosterModal'
import './styles/roster-page.css'
import './styles/roster-toolbar.css'
import './styles/roster-footer.css'
import './styles/roster-table.css'

export default function StaffRosterPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('All Roles')
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = 14
  const totalMembers = 128

  const filtered = rosterMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab =
      activeTab === 'All Roles' ||
      (activeTab === 'Administrators' && m.role === 'Administrator') ||
      (activeTab === 'Editors' && m.role === 'Editor') ||
      (activeTab === 'Staff' && m.role === 'Staff')
    return matchesSearch && matchesTab
  })

  function getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = []
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i)
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...')
      }
    }
    return pages
  }

  return (
    <div className="roster-page">
      <nav className="roster-nav">
        <div className="roster-nav-inner">
          <div className="roster-nav-left">
            <Link to="/" className="roster-nav-brand">
              <img src={nataleLogo} alt="Natale" className="roster-nav-logo" />
              Natale
            </Link>
            <div className="roster-nav-links">
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/staff" className="active">Staff</Link>
              <Link to="/devices">Devices</Link>
              <Link to="/analytics">Analytics</Link>
            </div>
          </div>
          <div className="roster-nav-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52424e', display: 'flex', alignItems: 'center', padding: 6 }} title="Notifications"><Bell size={20} /></button>
            <Link to="/settings/organization" style={{ color: '#52424e', display: 'flex', alignItems: 'center', padding: 6 }} title="Settings"><Settings size={20} /></Link>
            <div className="roster-nav-avatar">AK</div>
          </div>
        </div>
      </nav>

      <main className="roster-main">
        <div className="roster-header">
          <h1>Staff Roster</h1>
          <p>Manage identity access and hardware assignments across your infrastructure.</p>
        </div>

        <div className="roster-toolbar">
          <div className="roster-toolbar-left">
            <button className="roster-add-btn" onClick={() => setModalOpen(true)}>
              <Plus size={18} />
              Add New Staff
            </button>
            <div className="roster-search">
              <Search size={16} color="#a1a1aa" />
              <input
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="roster-filters">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                className={`roster-filter-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="roster-table-wrap">
          <table className="roster-table">
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Member</th>
                <th>Assigned Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td><span className="roster-id">{m.id}</span></td>
                  <td>
                    <div className="roster-member-cell">
                      <div className="roster-member-avatar">{getInitials(m.name)}</div>
                      <div className="roster-member-info">
                        <Link to={`/staff/${slugify(m.name)}`} className="roster-member-name">{m.name}</Link>
                        <span className="roster-member-email">{m.email}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="roster-role">{m.role}</span></td>
                  <td>
                    <span className={`roster-status ${m.status === 'On-Site' ? 'on-site' : 'off-site'}`}>
                      <span className="roster-status-dot" />
                      {m.status}
                    </span>
                  </td>
                  <td>
                    <button className="roster-actions-btn">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="roster-pagination">
            <span className="roster-pagination-info">
              Showing {filtered.length} of {totalMembers} members
            </span>
            <div className="roster-pagination-controls">
              <button
                className="roster-page-btn icon"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>
              {getPageNumbers().map((p, i) =>
                typeof p === 'number' ? (
                  <button
                    key={i}
                    className={`roster-page-btn ${currentPage === p ? 'active' : ''}`}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                ) : (
                  <span key={i} style={{ padding: '0 4px', color: '#a1a1aa' }}>...</span>
                )
              )}
              <button
                className="roster-page-btn icon"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>

      <StaffRosterModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <footer className="roster-footer">
        <div className="roster-footer-inner">
          <div>
            <div className="roster-footer-label">Natale Identity</div>
            <p className="roster-footer-copy">&copy; 2025 Natale Identity Corp. All rights reserved.</p>
          </div>
          <div className="roster-footer-links">
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
