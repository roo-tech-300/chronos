import { ShieldCheck, UserCheck } from 'lucide-react'
import { useDevPersona } from '../../context/DevPersonaContext'

export default function DevPersonaSwitcher() {
  const { role, toggleRole, currentDepartment } = useDevPersona()

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-zinc-900/95 backdrop-blur-md text-white px-3 py-2 rounded-full border border-zinc-700/60 shadow-2xl transition-all duration-200">
      <div className="flex items-center gap-2 pr-2 border-r border-zinc-700">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
          Dev Mode
        </span>
      </div>

      <button
        type="button"
        onClick={toggleRole}
        className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors cursor-pointer"
        title="Toggle between Super Admin & Head of Department view"
      >
        {role === 'admin' ? (
          <>
            <ShieldCheck size={14} className="text-amber-400" />
            <span>Global Admin</span>
          </>
        ) : (
          <>
            <UserCheck size={14} className="text-emerald-400" />
            <span>HOD: {currentDepartment.name}</span>
          </>
        )}
      </button>

      <span className="text-[10px] text-zinc-400 px-1 hidden sm:inline">
        Click to toggle persona
      </span>
    </div>
  )
}
