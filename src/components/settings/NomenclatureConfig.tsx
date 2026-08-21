import { useEffect } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import type { HierarchyLevelNaming } from '../../types/organization'

interface NomenclatureConfigProps {
  isOpen: boolean
  onClose: () => void
  levelNamings: HierarchyLevelNaming[]
  onUpdateLevelNamings: (updated: HierarchyLevelNaming[]) => void
}

export default function NomenclatureConfig({
  isOpen,
  onClose,
  levelNamings,
  onUpdateLevelNamings,
}: NomenclatureConfigProps) {
  // Global Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleChange = (index: number, value: string) => {
    const next = [...levelNamings]
    next[index] = { ...next[index], singular: value, plural: value.endsWith('s') ? value : `${value}s` }
    onUpdateLevelNamings(next)
  }

  const handleAddLevel = () => {
    const nextLevelNum = levelNamings.length + 1
    const defaultLabel = nextLevelNum === 2 ? 'Sub-Department' : `Sub-Level (Level ${nextLevelNum})`
    onUpdateLevelNamings([
      ...levelNamings,
      {
        level: nextLevelNum,
        singular: defaultLabel,
        plural: `${defaultLabel}s`,
      },
    ])
  }

  const handleRemoveLevel = (index: number) => {
    if (levelNamings.length <= 1) return
    const filtered = levelNamings.filter((_, i) => i !== index)
    const reindexed = filtered.map((item, i) => ({ ...item, level: i + 1 }))
    onUpdateLevelNamings(reindexed)
  }

  return (
    <>
      {/* Backdrop with click-outside-to-close */}
      <div
        className="fixed inset-0 bg-black/40 z-50 transition-opacity backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Slide-Over Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-[420px] max-w-[90vw] bg-white shadow-2xl border-l border-zinc-200 p-6 z-50 flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-100">
          <div>
            <h2 className="text-[18px] font-bold text-[#111827]">Department Naming Structure</h2>
            <p className="text-[13px] text-[#6b7280] mt-0.5">Customize terminology across depth tiers</p>
          </div>
          <button
            type="button"
            className="text-[#6b7280] hover:text-[#111827] hover:bg-zinc-100 p-2 rounded-full transition-colors cursor-pointer"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Level List */}
        <div className="flex-grow space-y-6">
          {levelNamings.map((lvl, index) => {
            const isPrimary = index === 0
            const hasNext = index < levelNamings.length - 1

            return (
              <div
                key={lvl.level}
                className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 relative"
              >
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">
                    {isPrimary ? 'Level 1 (Primary)' : `Level ${lvl.level}`}
                  </label>
                  {!isPrimary && (
                    <button
                      type="button"
                      title="Remove level"
                      className="text-zinc-400 hover:text-red-600 transition-colors p-1"
                      onClick={() => handleRemoveLevel(index)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder={isPrimary ? 'e.g. University, Faculty, Division' : 'e.g. Sub-Department, Unit'}
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3.5 py-2 text-[14px] text-[#111827] focus:ring-1 focus:ring-[#111827] focus:border-[#111827] focus:outline-none"
                  value={lvl.singular}
                  onChange={(e) => handleChange(index, e.target.value)}
                />

                {/* Connecting stem line */}
                {hasNext && (
                  <div className="absolute -bottom-6 left-8 w-[2px] h-6 bg-zinc-300 z-10" />
                )}
              </div>
            )
          })}

          <div className="pt-2">
            <button
              type="button"
              onClick={handleAddLevel}
              className="w-full flex items-center justify-center gap-2 bg-zinc-100 text-[#111827] hover:bg-zinc-200 transition-colors font-semibold text-[13px] rounded-full py-3 px-4 border border-zinc-300 cursor-pointer"
            >
              <Plus size={16} /> Add Sub-Level
            </button>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="mt-auto pt-6 border-t border-zinc-100">
          <button
            type="button"
            className="w-full bg-[#111827] hover:bg-black text-white font-bold text-[14px] py-3 rounded-xl transition-all cursor-pointer shadow-md"
            onClick={onClose}
          >
            Save Nomenclature
          </button>
        </div>
      </div>
    </>
  )
}
