import { useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import type { OrgUnit } from '../../types/organization'
import UnitForm, { type UnitEditorSubmit } from './UnitEditorForm'

export type { UnitEditorSubmit } from './UnitEditorForm'

interface NodeEditorModalProps {
  isOpen: boolean
  parentNode: OrgUnit | null
  editingUnit: OrgUnit | null
  headName: string | null
  onClose: () => void
  onSubmit: (payload: UnitEditorSubmit) => Promise<void>
}

export default function NodeEditorModal({
  isOpen,
  parentNode,
  editingUnit,
  headName,
  onClose,
  onSubmit,
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
              {editingUnit ? `Edit ${editingUnit.name}` : 'Add New Unit'}
            </h2>
            <p className="text-sm text-[#6b7280] mt-1">
              Configure the unit and assign its lead officer. Saved straight to the database.
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

        <UnitForm
          key={editingUnit?.id || parentNode?.id || 'new'}
          parentNode={parentNode}
          editingUnit={editingUnit}
          headName={headName}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  )
}
