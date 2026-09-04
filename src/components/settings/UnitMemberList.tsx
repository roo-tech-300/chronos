import { useState } from 'react'
import { Users, Trash2, ShieldCheck, UserPlus } from 'lucide-react'
import type { UnitMemberItem } from '../../services/unitMembersService'
import type { BadgeVariant } from '../ui/Badge'
import { Badge, Button } from '../ui'

interface UnitMemberListProps {
  members: UnitMemberItem[]
  isLoading: boolean
  onRemove: (memberId: string) => Promise<void>
  isRemoving: boolean
  onAssignClick: () => void
}

const TYPE_BADGE_VARIANTS: Record<string, BadgeVariant> = {
  primary: 'purple',
  joint: 'info',
  adjunct: 'success',
  secondment: 'warning',
  affiliate: 'neutral',
}

export function UnitMemberList({
  members,
  isLoading,
  onRemove,
  isRemoving,
  onAssignClick,
}: UnitMemberListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="py-8 space-y-3">
        {[0, 1].map((idx) => (
          <div key={idx} className="h-14 bg-zinc-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className="py-10 text-center bg-zinc-50 border border-zinc-200/80 rounded-2xl p-6">
        <Users size={32} className="mx-auto text-zinc-300 mb-2" />
        <p className="text-sm font-bold text-zinc-800">No staff assigned yet</p>
        <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto mb-4">
          Assign staff members to place them in this organization unit.
        </p>
        <Button variant="primary" size="sm" leftIcon={<UserPlus size={15} />} onClick={onAssignClick}>
          Assign First Member
        </Button>
      </div>
    )
  }

  const handleRemove = async (memberId: string) => {
    setRemovingId(memberId)
    try {
      await onRemove(memberId)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="divide-y divide-zinc-100 max-h-[380px] overflow-y-auto pr-1">
      {members.map((m) => {
        const initials = m.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'U'
        const badgeVariant = TYPE_BADGE_VARIANTS[m.assignmentType] || 'gray'

        return (
          <div key={m.id} className="py-3 flex items-center justify-between gap-3 group">
            <div className="flex items-center gap-3 min-w-0">
              {m.avatarUrl ? (
                <img src={m.avatarUrl} alt={m.name} className="w-9 h-9 rounded-full object-cover border border-zinc-200" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#7c007e]/10 text-[#7c007e] font-bold text-xs flex items-center justify-center border border-[#7c007e]/20">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-900 truncate">{m.name}</span>
                  {m.isPrimary && (
                    <span title="Primary Appointment" className="text-[#7c007e]">
                      <ShieldCheck size={13} />
                    </span>
                  )}
                  <Badge variant={badgeVariant} size="sm">
                    {m.assignmentType.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  {m.jobTitle ? `${m.jobTitle} • ` : ''}{m.email || m.roleLabel}
                </div>
              </div>
            </div>

            <button
              type="button"
              title="Remove from unit"
              disabled={isRemoving && removingId === m.memberId}
              onClick={() => handleRemove(m.memberId)}
              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer opacity-70 group-hover:opacity-100 disabled:opacity-40"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
