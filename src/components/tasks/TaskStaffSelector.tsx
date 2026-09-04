import { Check, Users } from 'lucide-react'

export interface StaffOption {
  id: string
  name: string
  role: string
  subDepartment: string
}

interface TaskStaffSelectorProps {
  staffList: StaffOption[]
  selectedIds: string[]
  onToggleStaff: (id: string) => void
  onToggleAll: () => void
  isAllSelected: boolean
}

export function TaskStaffSelector({
  staffList,
  selectedIds,
  onToggleStaff,
  onToggleAll,
  isAllSelected,
}: TaskStaffSelectorProps) {
  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl border border-zinc-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 uppercase tracking-wide">
          <Users size={14} className="text-zinc-500" />
          <span>Assign To Staff ({selectedIds.length} selected)</span>
        </div>
        <button
          type="button"
          onClick={onToggleAll}
          className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
        >
          {isAllSelected ? 'Deselect All' : 'Select All Staff'}
        </button>
      </div>

      <p className="text-[11px] text-zinc-500 leading-tight">
        Each chosen person will receive their own independent task to complete and submit.
      </p>

      {staffList.length === 0 && (
        <p className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5">
          No staff members exist in this workspace yet. Add team members to the roster before
          assigning tasks.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
        {staffList.map((staff) => {
          const isChecked = selectedIds.includes(staff.id)
          return (
            <button
              type="button"
              key={staff.id}
              onClick={() => onToggleStaff(staff.id)}
              className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                isChecked
                  ? 'bg-white border-zinc-900 shadow-xs'
                  : 'bg-white/60 border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <div className="min-w-0 pr-2">
                <div className="text-xs font-bold text-zinc-900 truncate">
                  {staff.name}
                </div>
                <div className="text-[10.5px] text-zinc-500 truncate">
                  {staff.subDepartment}
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                  isChecked ? 'bg-zinc-900 text-white' : 'border border-zinc-300 bg-white'
                }`}
              >
                {isChecked && <Check size={12} strokeWidth={3} />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}