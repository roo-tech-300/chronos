import { Layers } from 'lucide-react'

interface UnitScopeOption {
  name: string
  memberCount: number
  taskCount?: number
}

interface UnitScopeToggleProps {
  activeUnit: string | 'all'
  units: UnitScopeOption[]
  totalTaskCount?: number
  onSelectUnit: (unit: string | 'all') => void
  accentColor?: string
}

export default function UnitScopeToggle({
  activeUnit,
  units,
  totalTaskCount = 0,
  onSelectUnit,
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
          const isSelected = activeUnit.toLowerCase() === unit.name.toLowerCase()
          return (
            <button
              key={unit.name}
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'text-white shadow-sm ring-1 ring-black/5'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900'
              }`}
              style={isSelected ? { backgroundColor: accentColor } : undefined}
              onClick={() => onSelectUnit(unit.name)}
            >
              {unit.name}
              {unit.taskCount !== undefined ? ` (${unit.taskCount})` : ` (${unit.memberCount})`}
            </button>
          )
        })}
      </div>
    </div>
  )
}
