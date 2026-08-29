import { CheckCircle2 } from 'lucide-react'

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
    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-8 backdrop-blur-xl animate-in zoom-in-95 duration-200">
      <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 size={44} />
      </div>
      <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
        {staff.type} Confirmed
      </span>
      <h2 className="text-2xl font-black text-white">{staff.name}</h2>
      <p className="text-xs font-mono text-zinc-400 mt-1">
        ID: {staff.id} • {staff.dept}
      </p>
      <p className="text-xs text-emerald-400 font-mono mt-3 font-semibold">
        Verified at {staff.time}
      </p>
    </div>
  )
}
