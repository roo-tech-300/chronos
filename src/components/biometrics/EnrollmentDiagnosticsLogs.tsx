import { Terminal } from 'lucide-react'
import type { EnrollmentStepLog } from '../../types/biometric'

interface EnrollmentDiagnosticsLogsProps {
  logs: EnrollmentStepLog[]
}

export function EnrollmentDiagnosticsLogs({ logs }: EnrollmentDiagnosticsLogsProps) {
  if (logs.length === 0) return null

  return (
    <div className="p-3 bg-zinc-950 text-zinc-200 rounded-2xl font-mono text-[11px] border border-zinc-800 shadow-inner">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-[11px] text-zinc-400">
        <span className="flex items-center gap-1.5 font-sans font-medium text-zinc-300">
          <Terminal size={13} className="text-purple-400" />
          Live Enrollment Diagnostics
        </span>
        <span className="text-[10px] text-zinc-500 font-sans">Futronic FS80H &bull; Supabase</span>
      </div>
      <div className="max-h-28 overflow-y-auto space-y-1 pr-1 select-text">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-2">
            <span className="text-zinc-500 select-none">[{log.time}]</span>
            <span
              className={
                log.type === 'success'
                  ? 'text-emerald-400 font-semibold'
                  : log.type === 'error'
                  ? 'text-rose-400 font-semibold'
                  : log.type === 'warn'
                  ? 'text-amber-400'
                  : 'text-zinc-300'
              }
            >
              {log.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
