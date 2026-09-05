import { Link } from 'react-router-dom'
import { Edit3, Trash2, UserPlus, ExternalLink } from 'lucide-react'
import type { OrgUnit } from '../../types/organization'

interface HierarchyNodeActionsProps {
  node: OrgUnit
  unitPath: string
  accentColor: string
  onAddChild: (unit: OrgUnit) => void
  onEditNode: (unit: OrgUnit) => void
  onDeleteNode: (unit: OrgUnit) => void
  onManageMembers?: (unit: OrgUnit) => void
}

/** Hover-revealed action cluster on the right edge of a hierarchy row. */
export default function HierarchyNodeActions({
  node,
  unitPath,
  accentColor,
  onAddChild,
  onEditNode,
  onDeleteNode,
  onManageMembers,
}: HierarchyNodeActionsProps) {
  return (
    <div
      className="flex items-center gap-1.5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity justify-end"
      onClick={(e) => e.stopPropagation()}
    >
      <Link
        to={unitPath}
        title="Open Department Workspace"
        className="p-1.5 text-zinc-500 hover:text-[#7c007e] hover:bg-[#7c007e]/10 rounded-md transition-colors"
      >
        <ExternalLink size={15} />
      </Link>

      <button
        type="button"
        className="text-[12px] font-bold px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer"
        style={{ color: accentColor }}
        onClick={() => onAddChild(node)}
      >
        Add Sub-Department
      </button>

      <button
        type="button"
        title="Manage staff members"
        className="p-1.5 text-zinc-500 hover:text-[#7c007e] hover:bg-[#7c007e]/10 rounded-md transition-colors cursor-pointer"
        onClick={() => onManageMembers?.(node)}
      >
        <UserPlus size={15} />
      </button>

      <button
        type="button"
        title="Edit unit"
        className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
        onClick={() => onEditNode(node)}
      >
        <Edit3 size={15} />
      </button>

      <button
        type="button"
        title="Delete unit and all sub-units"
        className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
        onClick={() => onDeleteNode(node)}
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}
