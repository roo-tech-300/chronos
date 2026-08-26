import { useRef } from 'react'
import { Upload, Check, Palette, Sparkles, X } from 'lucide-react'
import type { WorkspaceDraft } from '../../../types/workspaces'
import { BrandCardPreview } from '../BrandCardPreview'

const PRESET_PALETTES = [
  { name: 'Chronos Violet', hex: '#4f46e5', desc: 'Default' },
  { name: 'Obsidian Slate', hex: '#18181b', desc: 'Minimal' },
  { name: 'Emerald Cyber', hex: '#059669', desc: 'Bio & Health' },
  { name: 'Cobalt Shield', hex: '#2563eb', desc: 'Corporate' },
  { name: 'Amber Forge', hex: '#d97706', desc: 'Industrial' },
  { name: 'Crimson Ops', hex: '#dc2626', desc: 'Security' },
]

interface StepBrandingProps {
  draft: WorkspaceDraft
  onChange: (updates: Partial<WorkspaceDraft>) => void
}

export function StepBranding({ draft, onChange }: StepBrandingProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        onChange({ avatarUrl: e.target.result })
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 uppercase tracking-wider">
            <Palette size={14} className="text-zinc-400" />
            Accent Palette
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-400">Custom</span>
            <input
              type="color"
              value={draft.accentColor}
              onChange={(e) => onChange({ accentColor: e.target.value })}
              className="w-6 h-6 p-0 border border-zinc-200 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {PRESET_PALETTES.map((palette) => {
            const isSelected = draft.accentColor.toLowerCase() === palette.hex.toLowerCase()
            return (
              <button
                key={palette.hex}
                type="button"
                onClick={() => onChange({ accentColor: palette.hex })}
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-all ${
                  isSelected
                    ? 'border-[#7c007e] bg-purple-50 text-[#7c007e] ring-1 ring-[#7c007e] shadow-xs'
                    : 'border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full flex-shrink-0 border border-black/10 flex items-center justify-center"
                  style={{ backgroundColor: palette.hex }}
                >
                  {isSelected && <Check size={10} className="text-white" />}
                </span>
                <span className="text-xs font-semibold truncate">{palette.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
          <Sparkles size={14} className="text-zinc-400" />
          Workspace Logo (Optional)
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) handleImageUpload(file)
          }}
          className="border border-dashed border-zinc-300 rounded-xl p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:border-zinc-400 bg-zinc-50/50 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImageUpload(file)
            }}
          />
          <div className="flex items-center gap-2.5 text-xs text-zinc-600">
            <div className="w-10 h-10 rounded-lg bg-zinc-200 flex items-center justify-center text-zinc-600 flex-shrink-0 overflow-hidden border border-zinc-200">
              {draft.avatarUrl ? (
                <img
                  src={draft.avatarUrl}
                  alt="Workspace Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Upload size={16} />
              )}
            </div>
            <div>
              <p className="font-medium text-zinc-800">
                {draft.avatarUrl ? 'Logo attached' : 'Upload or drop logo here'}
              </p>
              <p className="text-[11px] text-zinc-400">
                {draft.avatarUrl ? 'Click or drop to replace' : 'PNG, JPG, or SVG up to 2MB'}
              </p>
            </div>
          </div>
          {draft.avatarUrl && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange({ avatarUrl: undefined })
              }}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <BrandCardPreview draft={draft} />
    </div>
  )
}
