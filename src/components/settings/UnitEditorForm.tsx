import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import type { OrgUnit, OrganizationUnitType } from '../../types/organization'
import { useWorkspace } from '../../context/useWorkspace'
import LeadPicker from './LeadPicker'

/** Payload emitted by the unit editor; unitId present = edit, absent = create. */
export interface UnitEditorSubmit {
  unitId?: string
  parentId: string | null
  name: string
  code: string
  unitType: OrganizationUnitType
  headMemberId: string | null
}

const UNIT_TYPE_OPTIONS: { value: OrganizationUnitType; label: string }[] = [
  { value: 'institution', label: 'Institution' },
  { value: 'directorate', label: 'Directorate' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'division', label: 'Division' },
  { value: 'department', label: 'Department' },
  { value: 'unit', label: 'Unit' },
  { value: 'lab', label: 'Lab' },
  { value: 'office', label: 'Office' },
]

/**
 * The editable unit form (name, code, type, lead officer). Lives inside the
 * NodeEditorModal shell; submit failures surface inline so nothing is lost.
 */
export default function UnitForm({
  parentNode,
  editingUnit,
  headName,
  onClose,
  onSubmit,
}: {
  parentNode: OrgUnit | null
  editingUnit: OrgUnit | null
  headName: string | null
  onClose: () => void
  onSubmit: (payload: UnitEditorSubmit) => Promise<void>
}) {
  const { accentColor = '#7c007e' } = useWorkspace()
  const [name, setName] = useState(editingUnit?.name || '')
  const [code, setCode] = useState(editingUnit?.code || '')
  const [unitType, setUnitType] = useState<OrganizationUnitType>(editingUnit?.unitType ?? 'department')
  const [headMemberId, setHeadMemberId] = useState<string | null>(editingUnit?.headMemberId ?? null)
  const [headLabel, setHeadLabel] = useState(headName || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !code.trim() || isSubmitting) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit({
        ...(editingUnit ? { unitId: editingUnit.id } : {}),
        parentId: editingUnit ? editingUnit.parentId : (parentNode ? parentNode.id : null),
        name: name.trim(),
        code: code.trim(),
        unitType,
        headMemberId,
      })
      onClose()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save the unit.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Unit Name */}
        <div>
          <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-1.5">
            Unit Name *
          </label>
          <input
            type="text"
            required
            className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#7c007e] focus:outline-none transition-all text-[14px] text-zinc-900"
            placeholder="e.g. Computer Science"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* 2-Column: Code & Unit Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-1.5">
              Unit Code *
            </label>
            <input
              type="text"
              required
              className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-[#7c007e] focus:outline-none transition-all text-zinc-900"
              placeholder="e.g. CS"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-1.5">
              Unit Type
            </label>
            <select
              className="w-full h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#7c007e] focus:outline-none transition-all text-[14px] text-zinc-900 cursor-pointer"
              value={unitType}
              onChange={(e) => setUnitType(e.target.value as OrganizationUnitType)}
            >
              {UNIT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Parent Unit (context only - units are re-parented by moving them) */}
        <div>
          <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-1.5">
            Parent Unit
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

        {/* Lead Officer Picker */}
        <div>
          <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-1.5">
            Unit Lead Officer
          </label>
          <LeadPicker
            value={headLabel}
            onChange={(selected) => {
              setHeadLabel(selected.name)
              setHeadMemberId(selected.memberId ?? null)
            }}
          />
        </div>
      </div>

      {/* Modal Footer */}
      <div className="p-6 bg-zinc-50 border-t border-zinc-100">
        {submitError && (
          <div className="mb-4 flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="px-6 py-2.5 text-sm font-semibold text-[#4b5563] hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ backgroundColor: accentColor }}
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {editingUnit ? 'Save Changes' : 'Create Unit'}
          </button>
        </div>
      </div>
    </form>
  )
}