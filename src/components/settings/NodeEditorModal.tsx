import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import type { OrganizationUnit, HierarchyLevelNaming } from '../../types/organization'
import { getLevelLabel } from '../../utils/hierarchyUtils'
import { useWorkspace } from '../../context/useWorkspace'
import LeadPicker from './LeadPicker'

interface NodeEditorModalProps {
  isOpen: boolean
  parentNode?: OrganizationUnit | null
  editingNode?: OrganizationUnit | null
  levelNamings: HierarchyLevelNaming[]
  onClose: () => void
  onSave: (nodeData: Omit<OrganizationUnit, 'id' | 'children'> & { id?: string }) => void
}

function DeptForm({
  parentNode,
  editingNode,
  levelNamings,
  onClose,
  onSave,
}: {
  parentNode?: OrganizationUnit | null
  editingNode?: OrganizationUnit | null
  levelNamings: HierarchyLevelNaming[]
  onClose: () => void
  onSave: (nodeData: Omit<OrganizationUnit, 'id' | 'children'> & { id?: string }) => void
}) {
  const { accentColor = '#7c007e' } = useWorkspace()
  const [name, setName] = useState(editingNode?.name || '')
  const [code, setCode] = useState(editingNode?.code || '')
  const [leadMemberId, setLeadMemberId] = useState<string | null>(editingNode?.leadMemberId || null)
  const [leadName, setLeadName] = useState(editingNode?.leadName || '')
  const [leadRoleTitle, setLeadRoleTitle] = useState(editingNode?.leadRoleTitle || '')
  const [leadEmail, setLeadEmail] = useState(editingNode?.leadEmail || '')
  const [location, setLocation] = useState(editingNode?.location || '')

  const currentLevel = editingNode ? editingNode.level : (parentNode ? parentNode.level + 1 : 1)
  const levelLabel = getLevelLabel(currentLevel, levelNamings)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onSave({
      ...(editingNode ? { id: editingNode.id } : {}),
      name: name.trim(),
      code: code.trim(),
      level: currentLevel,
      parentId: parentNode ? parentNode.id : (editingNode?.parentId || null),
      leadMemberId,
      leadName: leadName.trim(),
      leadRoleTitle: leadRoleTitle.trim(),
      leadEmail: leadEmail.trim() || undefined,
      staffCount: editingNode?.staffCount ?? 0,
      location: location.trim(),
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Department Name */}
        <div>
          <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-1.5">
            Department / Unit Name *
          </label>
          <input
            type="text"
            required
            className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#7c007e] focus:outline-none transition-all text-[14px] text-zinc-900"
            placeholder="e.g. Cybersecurity Science"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* 2-Column: Code & Level */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-1.5">
              Unit Code
            </label>
            <input
              type="text"
              className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-[#7c007e] focus:outline-none transition-all text-zinc-900"
              placeholder="e.g. CYB-01"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-1.5">
              Level
            </label>
            <select
              className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:ring-2 focus:outline-none transition-all text-[14px] text-zinc-900"
              disabled
              value={currentLevel}
            >
              <option value={currentLevel}>
                {levelLabel} (Level {currentLevel})
              </option>
            </select>
          </div>
        </div>

        {/* Parent Department */}
        <div>
          <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-1.5">
            Parent Department
          </label>
          <select
            disabled
            className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:ring-2 focus:outline-none transition-all text-[14px] text-zinc-900 disabled:opacity-60"
            value={parentNode?.name || 'None - Top Level'}
          >
            <option value={parentNode?.name || 'None - Top Level'}>
              {parentNode?.name || 'None - Top Level'}
            </option>
          </select>
        </div>

        {/* Designation Title & Lead Officer Picker */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-1.5">
              Designation Title
            </label>
            <input
              type="text"
              className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#7c007e] focus:outline-none transition-all text-[14px] text-zinc-900"
              placeholder="e.g. Head of Department"
              value={leadRoleTitle}
              onChange={(e) => setLeadRoleTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-1.5">
              Department Lead Officer
            </label>
            <LeadPicker
              value={leadName}
              leadMemberId={leadMemberId}
              onChange={(selected) => {
                setLeadName(selected.name)
                if (selected.memberId !== undefined) setLeadMemberId(selected.memberId)
                if (selected.roleLabel && !leadRoleTitle) setLeadRoleTitle(selected.roleLabel)
                if (selected.email) setLeadEmail(selected.email)
              }}
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-1.5">
            Building / Location
          </label>
          <input
            type="text"
            className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#7c007e] focus:outline-none transition-all text-[14px] text-zinc-900"
            placeholder="e.g. Senate Building, 3rd Floor"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
      </div>

      {/* Modal Footer */}
      <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3">
        <button
          type="button"
          className="px-6 py-2.5 text-sm font-semibold text-[#4b5563] hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          style={{ backgroundColor: accentColor }}
        >
          {editingNode ? 'Save Changes' : 'Create Department'}
        </button>
      </div>
    </form>
  )
}

export default function NodeEditorModal({
  isOpen,
  parentNode,
  editingNode,
  levelNamings,
  onClose,
  onSave,
}: NodeEditorModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with click-outside listener */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[4px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden transform transition-all z-10 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-100 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">
              {editingNode ? `Edit ${editingNode.name}` : 'Add New Department'}
            </h2>
            <p className="text-sm text-[#6b7280] mt-1">
              Configure unit details, parent hierarchy, and assign a lead officer.
            </p>
          </div>
          <button
            type="button"
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-[#6b7280] hover:text-[#111827] cursor-pointer"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <DeptForm
          key={editingNode?.id || parentNode?.id || 'new'}
          parentNode={parentNode}
          editingNode={editingNode}
          levelNamings={levelNamings}
          onClose={onClose}
          onSave={onSave}
        />
      </div>
    </div>
  )
}
