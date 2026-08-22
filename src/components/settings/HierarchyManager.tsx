import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { HierarchyNode, HierarchyLevelNaming } from '../../types/organization'
import { Button, Toolbar } from '../ui'
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
      <Toolbar
        search={{
          placeholder: 'Search departments, code, or lead...',
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          onClear: () => setSearchQuery(''),
          width: 'w-full sm:w-80 md:w-96',
        }}
        rightContent={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={onOpenNamingRules}
            >
              Edit Naming Rules
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={18} />}
              onClick={() => onAddChild(rootNode)}
            >
              Add Department
            </Button>
          </div>
        }
      />

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

