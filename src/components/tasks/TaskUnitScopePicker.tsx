import type { OrgUnit } from '../../types/organization'

interface TaskUnitScopePickerProps {
  units: OrgUnit[]
  selectedUnitId: string
  onSelectUnit: (id: string) => void
  unitName?: string
  canChangeUnit: boolean
}

export function TaskUnitScopePicker({
  units,
  selectedUnitId,
  onSelectUnit,
  canChangeUnit,
}: TaskUnitScopePickerProps) {
  if (!canChangeUnit || units.length <= 1) {
    return null
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wide flex items-center justify-between">
        <span>Target Organization Unit</span>
        <span className="text-[11px] font-normal text-zinc-500">
          Assignees scoped to this unit
        </span>
      </label>
      <select
        value={selectedUnitId}
        onChange={(e) => onSelectUnit(e.target.value)}
        className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all cursor-pointer"
      >
        {units.map((unit) => (
          <option key={unit.id} value={unit.id}>
            {unit.name}
          </option>
        ))}
      </select>
    </div>
  )
}
