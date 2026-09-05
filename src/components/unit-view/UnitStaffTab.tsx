import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, UserPlus, Trash2, ExternalLink, ShieldCheck, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import type { UnitMemberItem } from '../../services/unitMembersService'
import type { OrgUnit } from '../../types/organization'
import type { TaskItem } from '../../types/tasks'
import type { BadgeVariant } from '../ui/Badge'
import { useStaffWorkload } from '../../hooks/useStaffWorkload'
import { Badge, Button, SearchInput } from '../ui'

interface UnitStaffTabProps {
  members: UnitMemberItem[]
  isLoading: boolean
  workspaceId: string
  unit: OrgUnit
  tasks: TaskItem[]
  onAddStaff: () => void
  onRemoveMember: (memberId: string) => Promise<void>
  isRemoving: boolean
}

const TYPE_BADGE_VARIANTS: Record<string, BadgeVariant> = {
  primary: 'purple',
  joint: 'info',
  adjunct: 'success',
  secondment: 'warning',
  affiliate: 'neutral',
}

export function UnitStaffTab({
  members,
  isLoading,
  workspaceId,
  unit,
  tasks,
  onAddStaff,
  onRemoveMember,
  isRemoving,
}: UnitStaffTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const { memberTasksMap, filteredMembers } = useStaffWorkload(members, tasks, searchQuery)

  const handleRemove = async (memberId: string) => {
    setRemoveError(null)
    setRemovingId(memberId)
    try {
      await onRemoveMember(memberId)
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'Failed to remove member assignment.')
    } finally {
      setRemovingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="py-12 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-zinc-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
        <Users size={36} className="mx-auto text-zinc-300 mb-3" />
        <h3 className="text-base font-bold text-zinc-900">No personnel appointed yet</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto mb-5">
          Assign faculty, staff, or research personnel to {unit.name} to establish their reporting chain and track workload.
        </p>
        <Button variant="primary" size="sm" leftIcon={<UserPlus size={15} />} onClick={onAddStaff}>
          Assign First Member
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search & Actions toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-4 rounded-xl border border-zinc-200">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Search personnel by name or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-zinc-500">
            {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
          </span>
          <Button variant="primary" size="sm" leftIcon={<UserPlus size={14} />} onClick={onAddStaff}>
            Add Staff
          </Button>
        </div>
      </div>

      {removeError && (
        <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={15} className="shrink-0 text-red-600" />
          <span>{removeError}</span>
        </div>
      )}

      {/* Staff roster list */}
      <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
        {filteredMembers.map((m) => {
          const initials = m.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'U'
          const badgeVariant = TYPE_BADGE_VARIANTS[m.assignmentType] || 'neutral'
          const isHOD = unit.headMemberId === m.memberId
          const workload = memberTasksMap.get(m.memberId) ?? { total: 0, approved: 0, submitted: 0, open: 0 }
          const profileLink = workspaceId ? `/workspace/${workspaceId}/staff/${m.memberId}` : `/staff/${m.memberId}`

          return (
            <div key={m.id} className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-50/70 transition-colors flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-3.5 min-w-0">
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt={m.name} className="w-10 h-10 rounded-full object-cover border border-zinc-200" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#7c007e]/10 text-[#7c007e] font-bold text-xs flex items-center justify-center border border-[#7c007e]/20 shrink-0">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={profileLink} className="text-sm font-bold text-zinc-900 hover:text-[#7c007e] transition-colors truncate">
                      {m.name}
                    </Link>
                    {isHOD && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-[#7c007e] border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldCheck size={11} /> HOD
                      </span>
                    )}
                    <Badge variant={badgeVariant} size="sm">
                      {m.assignmentType.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5 truncate">
                    {m.jobTitle ? `${m.jobTitle} • ` : ''}{m.roleLabel}{m.email ? ` • ${m.email}` : ''}
                  </div>
                </div>
              </div>

              {/* Workload summary pill & actions */}
              <div className="flex items-center gap-3 shrink-0 ml-auto sm:ml-0">
                <div className="hidden md:flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-zinc-100 rounded-md text-zinc-700 font-medium" title="Open tasks">
                    {workload.open} open
                  </span>
                  {workload.submitted > 0 && (
                    <span className="px-2 py-1 bg-purple-50 text-[#7c007e] border border-purple-100 rounded-md font-medium flex items-center gap-1" title="Waiting approval">
                      <Clock size={12} /> {workload.submitted} submitted
                    </span>
                  )}
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md font-medium flex items-center gap-1" title="Approved tasks">
                    <CheckCircle2 size={12} /> {workload.approved}
                  </span>
                </div>

                <Link
                  to={profileLink}
                  title="View Staff Profile"
                  className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  <ExternalLink size={15} />
                </Link>

                <button
                  type="button"
                  title="Remove from unit"
                  disabled={isRemoving && removingId === m.memberId}
                  onClick={() => handleRemove(m.memberId)}
                  className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
