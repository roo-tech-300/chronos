import { ChevronRight } from 'lucide-react'
import type { StaffTaskGroup } from '../../dummy/tasks-mock'

interface StaffMemberRowProps {
  member: StaffTaskGroup
  onSelect: () => void
}

/**
 * One clickable person row inside the directory modal's staff list.
 * Surfacing the per-status tallies up front means a HOD can spot who has
 * submissions waiting before committing to the drill-down.
 */
export default function StaffMemberRow({ member, onSelect }: StaffMemberRowProps) {
  const approvedCount = member.tasks.filter((t) => t.status === 'approved').length
  const submittedCount = member.tasks.filter((t) => t.status === 'submitted').length

  return (
    <button type="button" className="member-row" onClick={onSelect}>
      <span
        className={`person-avatar person-avatar--md ${member.isLead ? 'person-avatar--lead' : ''}`}
      >
        {member.initials}
      </span>

      <span className="member-row-main">
        <span className="member-row-name">
          {member.name}
          {member.isLead && <span className="hod-pill">HOD</span>}
        </span>
        <p className="member-row-role">
          {member.role} · {member.subDepartment}
        </p>
      </span>

      <span className="hidden sm:flex items-center gap-3">
        <span className="dot-chip dot-chip--ok">{approvedCount}</span>
        <span className={`dot-chip ${submittedCount > 0 ? 'dot-chip--warn' : ''}`}>
          {submittedCount} waiting
        </span>
      </span>

      <ChevronRight size={16} className="member-row-chevron" />
    </button>
  )
}