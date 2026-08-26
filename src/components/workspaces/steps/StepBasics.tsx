import { useState } from 'react'
import { Tag, Plus, Check } from 'lucide-react'
import type { WorkspaceDraft } from '../../../types/workspaces'

const DEFAULT_CATEGORIES = [
  'Technology',
  'Healthcare & Bio',
  'Education & University',
  'Government & Security',
  'Enterprise & Corporate',
  'Industrial & Logistics',
]

interface StepBasicsProps {
  draft: WorkspaceDraft
  onChange: (updates: Partial<WorkspaceDraft>) => void
}

export function StepBasics({ draft, onChange }: StepBasicsProps) {
  const [isCustomMode, setIsCustomMode] = useState(
    () => !DEFAULT_CATEGORIES.includes(draft.category) && draft.category !== ''
  )
  const [customValue, setCustomValue] = useState(
    () => (!DEFAULT_CATEGORIES.includes(draft.category) ? draft.category : '')
  )

  const handleSelectPreset = (cat: string) => {
    setIsCustomMode(false)
    onChange({ category: cat })
  }

  const handleCustomChange = (val: string) => {
    setCustomValue(val)
    onChange({ category: val })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
          Organization Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          autoFocus
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-zinc-300 rounded-xl focus:outline-none focus:border-[#7c007e] focus:ring-1 focus:ring-[#7c007e] transition-all placeholder:text-zinc-400"
          placeholder="e.g. Wayne Enterprises, BioDefense Lab"
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 uppercase tracking-wider">
            <Tag size={14} className="text-zinc-400" />
            Industry / Classification
          </label>
          <button
            type="button"
            onClick={() => {
              setIsCustomMode(!isCustomMode)
              if (!isCustomMode) {
                onChange({ category: customValue || 'Custom' })
              } else {
                onChange({ category: 'Technology' })
              }
            }}
            className="text-[11px] font-semibold text-[#7c007e] hover:text-[#570058] flex items-center gap-1 transition-colors"
          >
            {isCustomMode ? <Check size={12} /> : <Plus size={12} />}
            {isCustomMode ? 'Use Preset' : 'Custom Industry'}
          </button>
        </div>

        {isCustomMode ? (
          <div className="space-y-1.5">
            <input
              type="text"
              autoFocus
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#7c007e] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#7c007e] transition-all placeholder:text-zinc-400"
              placeholder="e.g. Aerospace, Robotics, Non-Profit Research"
              value={customValue}
              onChange={(e) => handleCustomChange(e.target.value)}
            />
            <p className="text-[11px] text-zinc-400">
              Type your custom industry classification name above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {DEFAULT_CATEGORIES.map((cat) => {
              const isSelected = draft.category === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSelectPreset(cat)}
                  className={`px-3 py-2 text-xs font-medium rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-[#7c007e] bg-[#7c007e] text-white shadow-xs'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
