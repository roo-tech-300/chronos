import { CheckCircle2, AlertCircle, Clock, Database, CloudOff } from 'lucide-react'
import type { ScannedStaffResult } from '../../hooks/useKioskScan'

interface KioskSuccessCardProps {
  staff: ScannedStaffResult
  isError?: boolean
  errorMessage?: string
}

export function KioskSuccessCard({ staff, isError, errorMessage }: KioskSuccessCardProps) {
  if (isError) {
    return (
      <div className="bg-white border-2 border-red-500/80 rounded-3xl p-8 sm:p-10 shadow-xl shadow-red-500/10 animate-in zoom-in-95 duration-200 max-w-md mx-auto text-center">
        <div className="w-20 h-20 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <AlertCircle size={44} />
        </div>
        <span className="inline-block px-3.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-extrabold uppercase tracking-wider mb-2">
          Verification Error
        </span>
        <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">Scan Unsuccessful</h2>
        <p className="text-xs text-red-600 mt-2 font-medium">{errorMessage || 'Please try scanning your finger again.'}</p>
        <p className="text-[11px] text-zinc-400 mt-4 font-medium">Resetting station in 3.0 seconds...</p>
      </div>
    )
  }

  const isCheckIn = staff.type === 'Check-In'

  return (
    <div className="bg-white border-2 border-emerald-500/80 rounded-3xl p-8 sm:p-10 shadow-xl shadow-emerald-500/10 animate-in zoom-in-95 duration-200 max-w-md mx-auto text-center">
      <div className="relative w-20 h-20 mx-auto mb-4">
        {staff.avatarUrl ? (
          <img
            src={staff.avatarUrl}
            alt={staff.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-sm">
            <CheckCircle2 size={44} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
        <span
          className={`inline-block px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
            isCheckIn
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {staff.type} Confirmed
        </span>

        {staff.role && (
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
            {staff.role}
          </span>
        )}

        {staff.dbSaved !== undefined && (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              staff.dbSaved
                ? 'bg-purple-50 text-[#7c007e] border-purple-200'
                : 'bg-zinc-100 text-zinc-600 border-zinc-200'
            }`}
          >
            {staff.dbSaved ? <Database size={10} /> : <CloudOff size={10} />}
            <span>{staff.dbSaved ? 'Supabase Saved' : 'Buffered'}</span>
          </span>
        )}
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">{staff.name}</h2>

      <p className="text-xs font-mono text-zinc-500 mt-1.5 font-medium">
        ID: {staff.id} • {staff.dept}
      </p>

      <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-mono font-bold">
        <Clock size={14} />
        <span>Verified at {staff.time}</span>
      </div>

      <p className="text-[11px] text-zinc-400 mt-2 font-medium">Resetting station in 3.0 seconds...</p>
    </div>
  )
}
