import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MoreVertical } from 'lucide-react'
import { filterTabs, getInitials } from './dummy/roster-mock'
import AppNavbar from './components/layout/AppNavbar'
import { useDevPersona } from './context/DevPersonaContext'
import { useWorkspace } from './context/useWorkspace'
import { Badge, Pagination, Toolbar } from './components/ui'
import { useStaffRoster } from './hooks/useStaffRoster'
import type { StaffMember } from './types/staff'
import './styles/roster-page.css'
import './styles/roster-toolbar.css'
import './styles/roster-footer.css'
import './styles/roster-table.css'

export default function StaffRosterPage() {
  const { workspaceId } = useParams()
  const { role, currentDepartment } = useDevPersona()
  const { accentColor } = useWorkspace()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('All Roles')
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 8

  // Server-side paginated query via TanStack Query and Supabase
  const { data: paginatedResult } = useStaffRoster({
    workspaceId,
    page: currentPage,
    pageSize: itemsPerPage,
    search: searchQuery,
    roleTab: activeTab,
    role,
  })

  const members = paginatedResult?.members || []
  const totalItems = paginatedResult?.totalItems || 0
  const totalPages = paginatedResult?.totalPages || 1

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    setCurrentPage(1)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  return (
    <div
      className="roster-page"
      style={
        {
          '--roster-primary': accentColor,
          '--workspace-accent': accentColor,
        } as React.CSSProperties
      }
    >
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
            onChange: (e) => handleSearchChange(e.target.value),
            onClear: () => handleSearchChange(''),
            width: 'w-full sm:w-72',
          }}
          tabs={{
            tabs: filterTabs,
            activeTab: activeTab,
            onChange: handleTabChange,
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
              {members.length > 0 ? (
                members.map((m: StaffMember) => {
                  const profileLink = workspaceId
                    ? `/workspace/${workspaceId}/staff/${m.id}`
                    : `/staff/${m.id}`
                  return (
                    <tr key={m.id}>
                      <td><span className="roster-id">{m.staffCode || m.id}</span></td>
                      <td>
                        <div className="roster-member-cell">
                          <div className="roster-member-avatar overflow-hidden">
                            {m.avatarUrl ? (
                              <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                            ) : (
                              getInitials(m.name)
                            )}
                          </div>
                          <div className="roster-member-info">
                            <Link to={profileLink} className="roster-member-name">{m.name}</Link>
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
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-400 text-sm">
                    No staff records match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="px-6 py-2 border-t border-zinc-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
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


