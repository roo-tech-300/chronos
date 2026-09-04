import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight, ChevronDown, Edit3, Trash2,
  User, Users, UserPlus, Landmark, Building2, ExternalLink,
} from 'lucide-react'
import type { OrgUnit } from '../../types/organization'
import type { OrgUnitNode } from '../../utils/orgUnitTree'
import { useWorkspace } from '../../context/useWorkspace'

interface HierarchyNodeRowProps {
  node: OrgUnitNode
  depth: number
  memberNameById: Record<string, string>
  memberCountByUnit: Record<string, number>
  onAddChild: (parent: OrgUnit) => void
  onEditNode: (unit: OrgUnit) => void
  onDeleteNode: (unit: OrgUnit) => void
  onManageMembers?: (unit: OrgUnit) => void
}

function formatUnitType(unitType: string): string {
  return unitType
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function HierarchyNodeRow({
  node,
  depth,
  memberNameById,
  memberCountByUnit,
  onAddChild,
  onEditNode,
  onDeleteNode,
  onManageMembers,
}: HierarchyNodeRowProps) {
  const { accentColor = '#7c007e', currentWorkspace } = useWorkspace()
  const workspaceId = currentWorkspace?.id
  const unitPath = workspaceId ? `/workspace/${workspaceId}/units/${node.id}` : `/units/${node.id}`
  const [expanded, setExpanded] = useState(depth === 0)
  const hasChildren = node.children.length > 0
  const isApex = depth === 0
  const headName = node.headMemberId ? memberNameById[node.headMemberId] : undefined
  const staffCount = memberCountByUnit[node.id] ?? 0

  return (
    <div className="relative group select-none">
      {/* Node Row Container */}
      <div
        className={`flex items-center justify-between p-3.5 hover:bg-zinc-50/80 rounded-xl transition-all border border-transparent hover:border-zinc-200 cursor-pointer ${
          isApex ? 'bg-white' : 'bg-white mt-1'
        }`}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {/* Left segment: Expand chevron, Icon, Title, Badge */}
        <div className="flex items-center gap-3.5 flex-grow min-w-0">
          {hasChildren ? (
            <button
              type="button"
              className="text-zinc-500 hover:text-zinc-900 transition-colors p-1 rounded cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(!expanded)
              }}
            >
              {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          ) : (
            <div className="w-[26px]" />
          )}

          <div
            className={`flex-shrink-0 flex items-center justify-center rounded-lg border ${
              isApex
                ? 'w-11 h-11'
                : 'w-9 h-9 bg-zinc-100 text-zinc-600 border-zinc-200'
            }`}
            style={
              isApex
                ? {
                    backgroundColor: `${accentColor}15`,
                    color: accentColor,
                    borderColor: `${accentColor}35`,
                  }
                : undefined
            }
          >
            {isApex ? <Landmark size={20} /> : <Building2 size={16} />}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              to={unitPath}
              onClick={(e) => e.stopPropagation()}
              className={`text-zinc-900 hover:text-[#7c007e] transition-colors ${isApex ? 'text-[15px] font-bold' : 'text-[14px] font-semibold'}`}
              title="Open Department Workspace"
            >
              {node.name} {node.code ? `(${node.code})` : ''}
            </Link>

            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                isApex ? '' : 'bg-zinc-100 text-zinc-600 border-zinc-200'
              }`}
              style={
                isApex
                  ? {
                      backgroundColor: `${accentColor}10`,
                      color: accentColor,
                      borderColor: `${accentColor}30`,
                    }
                  : undefined
              }
            >
              {formatUnitType(node.unitType)}
            </span>

            {hasChildren && !expanded && (
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: `${accentColor}10`,
                  color: accentColor,
                  borderColor: `${accentColor}30`,
                }}
              >
                +{node.children.length} sub-units
              </span>
            )}
          </div>
        </div>

        {/* Middle segment: Lead + staff metadata */}
        <div className="hidden sm:flex items-center justify-center px-4 w-[280px] gap-4">
          <div className="flex items-center gap-1.5 text-[13px] text-zinc-600 whitespace-nowrap">
            <User size={14} className="text-zinc-400" />
            <span>Lead: {headName ?? 'Unassigned'}</span>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 text-[13px] text-zinc-600 hover:text-zinc-950 px-2 py-1 rounded-md hover:bg-zinc-100 transition-colors cursor-pointer whitespace-nowrap"
            title="Manage unit staff"
            onClick={(e) => {
              e.stopPropagation()
              onManageMembers?.(node)
            }}
          >
            <Users size={14} className="text-zinc-400" />
            <span className="font-medium">{staffCount} staff</span>
          </button>
        </div>

        {/* Right segment: Actions */}
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
      </div>

      {hasChildren && expanded && (
        <div className="ml-6 sm:ml-9 pl-4 relative mt-1 border-l-2 border-zinc-200">
          {node.children.map((child) => (
            <div key={child.id} className="relative before:content-[''] before:absolute before:-left-4 before:top-6 before:w-4 before:h-[2px] before:bg-zinc-200">
              <HierarchyNodeRow
                node={child}
                depth={depth + 1}
                memberNameById={memberNameById}
                memberCountByUnit={memberCountByUnit}
                onAddChild={onAddChild}
                onEditNode={onEditNode}
                onDeleteNode={onDeleteNode}
                onManageMembers={onManageMembers}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
