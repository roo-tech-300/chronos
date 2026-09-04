import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import type { OrgUnit } from '../../types/organization'
import { filterUnitTree, type OrgUnitNode } from '../../utils/orgUnitTree'
import { Button, Toolbar } from '../ui'
import HierarchyNodeRow from './HierarchyNodeRow'

interface HierarchyManagerProps {
  rootNodes: OrgUnitNode[]
  memberNameById: Record<string, string>
  memberCountByUnit: Record<string, number>
  onAddChild: (parent: OrgUnit | null) => void
  onEditNode: (unit: OrgUnit) => void
  onDeleteNode: (unit: OrgUnit) => void
  onManageMembers?: (unit: OrgUnit) => void
}

export default function HierarchyManager({
  rootNodes,
  memberNameById,
  memberCountByUnit,
  onAddChild,
  onEditNode,
  onDeleteNode,
  onManageMembers,
}: HierarchyManagerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const isFiltering = searchQuery.trim().length > 0
  const visibleRoots = useMemo(
    () => filterUnitTree(rootNodes, searchQuery),
    [rootNodes, searchQuery],
  )

  return (
    <div className="w-full space-y-6">
      {/* Unified Header Utility Bar */}
      <Toolbar
        search={{
          placeholder: 'Search units by name or code...',
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          onClear: () => setSearchQuery(''),
          width: 'w-full sm:w-80 md:w-96',
        }}
        rightContent={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus size={18} />}
            onClick={() => onAddChild(null)}
          >
            Add Unit
          </Button>
        }
      />

      {/* Hierarchy Tree Container Card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-6 shadow-sm w-full">
        {visibleRoots.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm font-semibold text-zinc-700">
              {isFiltering ? 'No units match your search.' : 'No units yet.'}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {isFiltering
                ? 'Try a different unit name or code.'
                : 'Create your first unit to start building the workspace hierarchy.'}
            </p>
          </div>
        ) : (
          visibleRoots.map((node) => (
            <HierarchyNodeRow
              key={node.id}
              node={node}
              depth={0}
              memberNameById={memberNameById}
              memberCountByUnit={memberCountByUnit}
              onAddChild={onAddChild}
              onEditNode={onEditNode}
              onDeleteNode={onDeleteNode}
              onManageMembers={onManageMembers}
            />
          ))
        )}
      </div>
    </div>
  )
}

