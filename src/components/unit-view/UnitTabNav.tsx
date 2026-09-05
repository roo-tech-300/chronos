import { CheckSquare, Users, GitFork } from 'lucide-react'

export type UnitDepartmentTab = 'tasks' | 'staff' | 'subunits'

interface UnitTabNavProps {
  activeTab: UnitDepartmentTab
  onChange: (tab: UnitDepartmentTab) => void
  taskCount: number
  memberCount: number
  subUnitCount: number
}

const TAB_BUTTON_CLASS =
  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap'

/**
 * Underlined tab switcher for the Unit Department workspace
 * (Tasks / Staff Roster / Sub-Departments).
 */
export function UnitTabNav({
  activeTab,
  onChange,
  taskCount,
  memberCount,
  subUnitCount,
}: UnitTabNavProps) {
  return (
    <div className="flex items-center gap-2 border-b border-zinc-200 mb-6 overflow-x-auto">
      <button
        type="button"
        onClick={() => onChange('tasks')}
        className={`${TAB_BUTTON_CLASS} ${
          activeTab === 'tasks'
            ? 'border-[#7c007e] text-[#7c007e]'
            : 'border-transparent text-zinc-500 hover:text-zinc-900'
        }`}
      >
        <CheckSquare size={16} />
        <span>Tasks ({taskCount})</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('staff')}
        className={`${TAB_BUTTON_CLASS} ${
          activeTab === 'staff'
            ? 'border-[#7c007e] text-[#7c007e]'
            : 'border-transparent text-zinc-500 hover:text-zinc-900'
        }`}
      >
        <Users size={16} />
        <span>Staff Roster ({memberCount})</span>
      </button>

      {subUnitCount > 0 && (
        <button
          type="button"
          onClick={() => onChange('subunits')}
          className={`${TAB_BUTTON_CLASS} ${
            activeTab === 'subunits'
              ? 'border-[#7c007e] text-[#7c007e]'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <GitFork size={16} />
          <span>Sub-Departments ({subUnitCount})</span>
        </button>
      )}
    </div>
  )
}
