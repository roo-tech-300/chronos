import { Bot, ChevronRight, Cpu, Server, UserRound, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import type { StatusSummary } from '../../utils/taskAggregation'

/** Hand-picked glyph per known sub-unit; falls back to a generic users icon. */
const UNIT_ICONS: Record<string, ReactNode> = {
  'Autonomous Systems': <Bot size={18} />,
  'Neural Hardware': <Cpu size={18} />,
  'Edge Compute': <Server size={18} />,
}

interface DepartmentUnitCardProps {
  unitName: string
  leadName: string | null
  memberCount: number
  summary: StatusSummary
  onSelect: () => void
}

export default function DepartmentUnitCard({
  unitName,
  leadName,
  memberCount,
  summary,
  onSelect,
}: DepartmentUnitCardProps) {
  return (
    <button type="button" className="unit-card group" onClick={onSelect}>
      <span className="unit-card-top">
        <span className="unit-card-icon">{UNIT_ICONS[unitName] ?? <Users size={18} />}</span>
        <ChevronRight
          size={16}
          className="text-zinc-300 transition-transform group-hover:translate-x-0.5"
        />
      </span>

      <h3 className="unit-card-name">{unitName}</h3>
      <p className="unit-card-lead">
        <UserRound size={13} />
        {leadName ? `Lead · ${leadName}` : 'No unit lead assigned'}
      </p>

      <span className="unit-card-foot">
        <span className="dot-chip dot-chip--ok">{summary.approved} approved</span>
        <span className={`dot-chip ${summary.submitted > 0 ? 'dot-chip--warn' : ''}`}>
          {summary.submitted} waiting
        </span>
        <span className="dot-chip">{summary.notDone} open</span>
        <span className="ml-auto text-[11px] font-semibold text-zinc-400">
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </span>
      </span>
    </button>
  )
}