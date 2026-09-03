import { Layers } from 'lucide-react'
import type { UnitScopeMode } from '../../utils/taskUnitScoping'

interface UnitScopeOption {
  /** organization_units.id - selection is id-based, not name-based. */
  id: string
  name: string
  memberCount: number
  taskCount?: number
}

interface UnitScopeToggleProps {
  activeUnit: string | 'all'
  units: UnitScopeOption[]
  totalTaskCount?: number
  onSelectUnit: (unitId: string | 'all') => void
  /** When provided, renders the immediate-vs-subordinate scope mode buttons. */
  scopeMode?: UnitScopeMode
  onScopeModeChange?: (mode: UnitScopeMode) => void
  accentColor?: string
}

export default function UnitScopeToggle({
  activeUnit,
  units,
  totalTaskCount = 0,
  onSelectUnit,
  scopeMode,
  onScopeModeChange,
  accentColor = '#7c007e',
}: UnitScopeToggleProps) {
  const isAll = activeUnit === 'all' || !activeUnit

  return (
    <div className="w-full flex items-center justify-between gap-3 flex-wrap py-2 border-y border-zinc-100/80 mb-5">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
        <Layers size={14} className="text-zinc-400" />
        <span>Unit Scope:</span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            isAll
              ? 'text-white shadow-sm ring-1 ring-black/5'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900'
          }`}
          style={isAll ? { backgroundColor: accentColor } : undefined}
          onClick={() => onSelectUnit('all')}
        >
          All Units ({totalTaskCount})
        </button>

        {units.map((unit) => {
          const isSelected = activeUnit === unit.id
          return (
            <button
              key={unit.id}
              type="button"
              title={unit.name}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'text-white shadow-sm ring-1 ring-black/5'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900'
              }`}
              style={isSelected ? { backgroundColor: accentColor } : undefined}
              onClick={() => onSelectUnit(unit.id)}
            >
              {unit.name}
              {unit.taskCount !== undefined ? ` (${unit.taskCount})` : ` (${unit.memberCount})`}
            </button>
          )
        })}

        {scopeMode && onScopeModeChange && !isAll && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Include:
            </span>
            {(['subtree', 'direct'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onScopeModeChange(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  scopeMode === mode
                    ? 'text-white shadow-sm ring-1 ring-black/5'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900'
                }`}
                style={scopeMode === mode ? { backgroundColor: accentColor } : undefined}
              >
                {mode === 'subtree' ? 'All subordinate units' : 'This unit only'}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
