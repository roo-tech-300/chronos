import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MoreVertical } from 'lucide-react'
import { rosterMembers, filterTabs, getInitials } from './dummy/roster-mock'
import { slugify } from './dummy/profile-mock'
import AppNavbar from './components/layout/AppNavbar'
import { useDevPersona } from './context/DevPersonaContext'
import { Badge, Pagination, Toolbar } from './components/ui'
import './styles/roster-page.css'
import './styles/roster-toolbar.css'
import './styles/roster-footer.css'
import './styles/roster-table.css'

export default function StaffRosterPage() {
  const { role, currentDepartment } = useDevPersona()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('All Roles')
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = 14
  const totalMembers = 128

  // In HOD mode, scope staff members to department & sub-units
  const scopedMembers = useMemo(() => {
    if (role === 'admin') return rosterMembers
    // Filter to department staff for HOD
    return rosterMembers.filter(
      (m) =>
        m.role === 'Staff' ||
        m.name.includes('Marcus') ||
        m.name.includes('Elena') ||
        m.name.includes('Devon') ||
        m.name.includes('Sarah')
    )
  }, [role])

  const filtered = scopedMembers.filter((m) => {
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

  return (
    <div className="roster-page">
      <AppNavbar />

      <main className="roster-main">
        <div className="roster-header">
          <div className="flex items-center gap-3">
            <h1>Staff Roster</h1>
            {role === 'hod' && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-200/80 font-bold text-zinc-800">
                {currentDepartment.name}
              </span>
            )}
          </div>
          <p>
            {role === 'admin'
              ? 'Manage identity access and hardware assignments across your infrastructure.'
              : `Viewing personnel roster scoped to ${currentDepartment.name} and sub-departments.`}
          </p>
        </div>

        <Toolbar
          className="mb-6"
          search={{
            placeholder: 'Search by name or ID...',
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            onClear: () => setSearchQuery(''),
            width: 'w-full sm:w-72',
          }}
          tabs={{
            tabs: filterTabs,
            activeTab: activeTab,
            onChange: setActiveTab,
            variant: 'pill',
          }}
        />

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
                    <Badge
                      variant={m.status === 'On-Site' ? 'success' : 'neutral'}
                      showDot
                    >
                      {m.status}
                    </Badge>
                  </td>
                  <td>
                    <button className="roster-actions-btn" aria-label="More actions">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-6 py-2 border-t border-zinc-100">
            <Pagination
              currentPage={currentPage}
              totalPages={role === 'admin' ? totalPages : 1}
              totalItems={role === 'admin' ? totalMembers : filtered.length}
              itemsPerPage={9}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </main>

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


