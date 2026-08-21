import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import type { HierarchyNode, HierarchyLevelNaming } from '../../types/organization'
import HierarchyNodeRow from './HierarchyNodeRow'

interface HierarchyManagerProps {
  rootNode: HierarchyNode
  levelNamings: HierarchyLevelNaming[]
  onOpenNamingRules: () => void
  onAddChild: (parentNode: HierarchyNode) => void
  onEditNode: (node: HierarchyNode) => void
  onDeleteNode: (nodeId: string) => void
}

export default function HierarchyManager({
  rootNode,
  levelNamings,
  onOpenNamingRules,
  onAddChild,
  onEditNode,
  onDeleteNode,
}: HierarchyManagerProps) {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="w-full space-y-6">
      {/* Unified Header Utility Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-zinc-200 shadow-sm gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Search departments, code, or lead..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-[14px] text-[#111827] focus:ring-1 focus:ring-[#111827] focus:border-[#111827] focus:bg-white focus:outline-none transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 justify-end">
          <button
            type="button"
            onClick={onOpenNamingRules}
            className="px-4 py-2 border border-zinc-200 text-[#191c1d] font-semibold text-[13.5px] rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            Edit Naming Rules
          </button>
          
          <button
            type="button"
            onClick={() => onAddChild(rootNode)}
            className="flex items-center gap-2 bg-[#111827] hover:bg-black text-white font-bold text-[13.5px] px-4 py-2 rounded-lg transition-all shadow-sm cursor-pointer active:scale-95 duration-150"
          >
            <Plus size={18} />
            Add Department
          </button>
        </div>
      </div>

      {/* Hierarchy Tree Container Card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-6 shadow-sm w-full">
        <HierarchyNodeRow
          node={rootNode}
          levelNamings={levelNamings}
          onAddChild={onAddChild}
          onEditNode={onEditNode}
          onDeleteNode={onDeleteNode}
        />
      </div>
    </div>
  )
}
