import { useState } from 'react'
import { Plus, Users, UserCheck, ChevronDown, ChevronUp } from 'lucide-react'
import type { HierarchyNode, HierarchyLevelNaming } from '../../types/organization'
import { getLevelLabel } from '../../utils/hierarchyUtils'

interface HierarchyVisualChartProps {
  node: HierarchyNode
  levelNamings: HierarchyLevelNaming[]
  onAddChild: (parentNode: HierarchyNode) => void
  onEditNode: (node: HierarchyNode) => void
}

export default function HierarchyVisualChart({
  node,
  levelNamings,
  onAddChild,
  onEditNode,
}: HierarchyVisualChartProps) {
  const [collapsed, setCollapsed] = useState(false)
  const hasChildren = node.children && node.children.length > 0
  const isApex = node.level === 1
  const levelLabel = getLevelLabel(node.level, levelNamings)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 8px' }}>
      {/* Node Box */}
      <div
        style={{
          width: 210,
          background: '#ffffff',
          borderRadius: 8,
          border: isApex ? '2px solid #111827' : '1px solid #d1d5db',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
          padding: '10px 12px',
          textAlign: 'center',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onClick={() => onEditNode(node)}
      >
        <div style={{ fontSize: 9.5, fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
          {levelLabel}
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#111827', lineHeight: 1.3, marginBottom: 3 }}>
          {node.name}
        </div>
        <div style={{ fontSize: 11, color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 3 }}>
          <UserCheck size={11} color="#059669" /> {node.leadName}
        </div>
        <div style={{ fontSize: 10.5, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Users size={10.5} /> {node.staffCount} staff
        </div>

        {/* Quick Add Sub-Unit Plus */}
        <button
          type="button"
          title="Add Sub-Unit"
          onClick={(e) => {
            e.stopPropagation()
            onAddChild(node)
          }}
          style={{
            position: 'absolute',
            bottom: -9,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#111827',
            color: '#ffffff',
            border: 'none',
            borderRadius: '50%',
            width: 18,
            height: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        >
          <Plus size={11} />
        </button>
      </div>

      {/* Expand/Collapse Child Trigger */}
      {hasChildren && (
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          style={{
            marginTop: 10,
            background: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: '1px 6px',
            fontSize: 9.5,
            color: '#6b7280',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {node.children.length} {collapsed ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
        </button>
      )}

      {/* Children branches */}
      {hasChildren && !collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 6 }}>
          {/* Vertical Stem down from parent */}
          <div style={{ width: 2, height: 16, background: '#cbd5e1' }} />

          {/* Children row */}
          <div style={{ display: 'flex', gap: 16, position: 'relative', paddingTop: 16 }}>
            {/* Horizontal branch line connecting all children if > 1 child */}
            {node.children.length > 1 && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 110,
                  right: 110,
                  height: 2,
                  background: '#cbd5e1',
                }}
              />
            )}

            {node.children.map((child) => (
              <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 2, height: 16, background: '#cbd5e1', marginTop: -16 }} />
                <HierarchyVisualChart
                  node={child}
                  levelNamings={levelNamings}
                  onAddChild={onAddChild}
                  onEditNode={onEditNode}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
