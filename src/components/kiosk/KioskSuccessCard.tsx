import { CheckCircle2, Clock } from 'lucide-react'

interface ScannedStaff {
  name: string
  id: string
  time: string
  dept: string
  type: 'Check-In' | 'Check-Out'
}

interface KioskSuccessCardProps {
  staff: ScannedStaff
}

export function KioskSuccessCard({ staff }: KioskSuccessCardProps) {
  return (
    <div className="bg-white border-2 border-emerald-500/80 rounded-3xl p-8 sm:p-10 shadow-xl shadow-emerald-500/10 animate-in zoom-in-95 duration-200 max-w-md mx-auto text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
        <CheckCircle2 size={44} />
      </div>

      <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold uppercase tracking-wider mb-2">
        {staff.type} Confirmed
      </span>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">{staff.name}</h2>

      <p className="text-xs font-mono text-zinc-500 mt-1.5 font-medium">
        ID: {staff.id} • {staff.dept}
      </p>

      <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-mono font-bold">
        <Clock size={14} />
        <span>Verified at {staff.time}</span>
      </div>

      <p className="text-[11px] text-zinc-400 mt-2 font-medium">
        Resetting station in 3.0 seconds...
      </p>
    </div>
  )
}
