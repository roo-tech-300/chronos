import { useState } from 'react'
import {
  ChevronRight, ChevronDown, Edit3, Trash2,
  User, Landmark, Building2,
} from 'lucide-react'
import type { HierarchyNode, HierarchyLevelNaming } from '../../types/organization'
import { getLevelLabel } from '../../utils/hierarchyUtils'

interface HierarchyNodeRowProps {
  node: HierarchyNode
  levelNamings: HierarchyLevelNaming[]
  onAddChild: (parentNode: HierarchyNode) => void
  onEditNode: (node: HierarchyNode) => void
  onDeleteNode: (nodeId: string) => void
}

export default function HierarchyNodeRow({
  node,
  levelNamings,
  onAddChild,
  onEditNode,
  onDeleteNode,
}: HierarchyNodeRowProps) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = node.children && node.children.length > 0
  const levelLabel = getLevelLabel(node.level, levelNamings)
  const isApex = node.level === 1

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
              className="text-zinc-500 hover:text-[#111827] transition-colors p-1 rounded cursor-pointer"
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
                ? 'w-11 h-11 bg-zinc-100 text-[#111827] border-zinc-300'
                : 'w-9 h-9 bg-zinc-100 text-zinc-600 border-zinc-200'
            }`}
          >
            {isApex ? <Landmark size={20} /> : <Building2 size={16} />}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`text-[#111827] ${isApex ? 'text-[15px] font-bold' : 'text-[14px] font-semibold'}`}>
              {node.name} {node.code ? `(${node.code})` : ''}
            </span>

            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                isApex
                  ? 'bg-zinc-100 text-[#111827] border-zinc-300'
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200'
              }`}
            >
              {levelLabel}
            </span>

            {hasChildren && !expanded && (
              <span className="text-[11px] font-semibold text-[#111827] bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
                +{node.children.length} sub-units
              </span>
            )}
          </div>
        </div>

        {/* Middle segment: Lead metadata */}
        <div className="hidden sm:flex items-center justify-center px-4 w-[260px]">
          <div className="flex items-center gap-1.5 text-[13px] text-zinc-600 whitespace-nowrap">
            <User size={14} className="text-zinc-400" />
            <span>Lead: {node.leadName}</span>
          </div>
        </div>

        {/* Right segment: Actions */}
        <div
          className="flex items-center gap-1.5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="text-[12px] font-bold text-[#111827] hover:bg-zinc-100 px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer"
            onClick={() => onAddChild(node)}
          >
            Add Sub-Department
          </button>

          <button
            type="button"
            title="Edit department"
            className="p-1.5 text-zinc-500 hover:text-[#111827] hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
            onClick={() => onEditNode(node)}
          >
            <Edit3 size={15} />
          </button>

          {!isApex && (
            <button
              type="button"
              title="Delete department"
              className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
              onClick={() => onDeleteNode(node.id)}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Nested Children with tree connecting stem */}
      {hasChildren && expanded && (
        <div className="ml-6 sm:ml-9 pl-4 relative mt-1 border-l-2 border-zinc-200">
          {node.children.map((child) => (
            <div key={child.id} className="relative before:content-[''] before:absolute before:-left-4 before:top-6 before:w-4 before:h-[2px] before:bg-zinc-200">
              <HierarchyNodeRow
                node={child}
                levelNamings={levelNamings}
                onAddChild={onAddChild}
                onEditNode={onEditNode}
                onDeleteNode={onDeleteNode}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
