import type { ReactNode } from 'react'
import {
  Fingerprint, CheckCircle2, History,
  Server, Building2, Building, LogOut, DoorOpen, Shield,
} from 'lucide-react'
import { Button, Badge } from '../ui'
import type { ScanActivity } from '../../dummy/profile-mock'

interface StaffOverviewCardProps {
  activities?: ScanActivity[]
  canEnroll?: boolean
  isEnrolled?: boolean
  onEnrollFingerprint: () => void
  onDownloadLog?: () => void
}

const TERMINAL_ICONS: Record<string, ReactNode> = {
  'Terminal 04 - East Wing': <DoorOpen size={18} />,
  'Server Room B': <Server size={18} />,
  'Boardroom North': <Building2 size={18} />,
  'Main Gate - Arrival': <Building size={18} />,
  'Main Gate - Departure': <LogOut size={18} />,
}

function getTerminalIcon(terminal: string): ReactNode {
  return TERMINAL_ICONS[terminal] ?? <Shield size={18} />
}

export default function StaffOverviewCard({
  activities = [],
  canEnroll = false,
  isEnrolled = false,
  onEnrollFingerprint,
  onDownloadLog,
}: StaffOverviewCardProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 bg-white">
        <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Overview & Activity</h2>
        <div className="flex items-center gap-2">
          {isEnrolled ? (
            <Badge variant="success" size="md">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={14} className="text-emerald-600" />
                Fingerprint Enrolled
              </span>
            </Badge>
          ) : (
            canEnroll && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Fingerprint size={16} />}
                onClick={onEnrollFingerprint}
              >
                Enroll Fingerprint
              </Button>
            )
          )}
        </div>
      </div>

      {/* Body: Activity Section Full Width */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <History size={16} className="text-zinc-500" />
            Recent Scan Activity
          </h3>
          <Button variant="outline" size="sm" onClick={onDownloadLog}>
            Download Log
          </Button>
        </div>

        {activities.length === 0 ? (
          <div className="border border-dashed border-zinc-200 rounded-lg p-8 text-center flex-1 flex flex-col items-center justify-center bg-zinc-50/50">
            <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mb-2.5">
              <History size={18} />
            </div>
            <p className="text-sm font-semibold text-zinc-700">No Biometric Scans Logged Yet</p>
            <p className="text-xs text-zinc-400 max-w-sm mt-1">
              Scanning at any paired Chronos hardware terminal will automatically record attendance logs here in real time.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 border border-zinc-100 rounded-lg overflow-hidden flex-1 bg-white">
            {activities.map((act, index) => (
              <div
                key={`${act.terminal}-${act.time}-${index}`}
                className="flex items-center justify-between p-4 hover:bg-zinc-50/80 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center shrink-0">
                    {getTerminalIcon(act.terminal)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{act.terminal}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{act.action}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-zinc-400 whitespace-nowrap tracking-wide">
                  {act.time}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
