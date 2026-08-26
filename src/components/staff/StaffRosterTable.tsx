import { Link } from 'react-router-dom'
import { MoreVertical, Loader2 } from 'lucide-react'
import { Badge } from '../ui'
import { getInitials } from '../../dummy/roster-mock'
import type { StaffMember } from '../../types/staff'

interface StaffRosterTableProps {
  members: StaffMember[]
  isLoading: boolean
  workspaceId?: string
  accentColor?: string
}

export function StaffRosterTable({
  members,
  isLoading,
  workspaceId,
  accentColor = '#7c3aed',
}: StaffRosterTableProps) {
  return (
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
        {isLoading ? (
          <tr>
            <td colSpan={5} className="py-20 text-center">
              <div className="flex flex-col items-center justify-center gap-3">
                <Loader2
                  size={32}
                  className="animate-spin text-zinc-600"
                  style={{ color: accentColor }}
                />
                <span className="text-sm font-medium text-zinc-500">
                  Loading staff roster from database...
                </span>
              </div>
            </td>
          </tr>
        ) : members.length > 0 ? (
          members.map((m: StaffMember) => {
            const profileLink = workspaceId
              ? `/workspace/${workspaceId}/staff/${m.id}`
              : `/staff/${m.id}`

            return (
              <tr key={m.id}>
                <td>
                  <span className="roster-id">{m.staffCode || m.id}</span>
                </td>
                <td>
                  <div className="roster-member-cell">
                    <div className="roster-member-avatar overflow-hidden">
                      {m.avatarUrl ? (
                        <img
                          src={m.avatarUrl}
                          alt={m.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials(m.name)
                      )}
                    </div>
                    <div className="roster-member-info">
                      <Link to={profileLink} className="roster-member-name">
                        {m.name}
                      </Link>
                      <span className="roster-member-email">{m.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="roster-role">{m.role}</span>
                </td>
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
  )
}
