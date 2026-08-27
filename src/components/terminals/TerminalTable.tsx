import { Laptop, QrCode, ShieldAlert, Wifi, WifiOff } from 'lucide-react'
import { Badge, Button } from '../ui'
import type { TerminalDevice } from '../../types/terminal'

interface TerminalTableProps {
  terminals: TerminalDevice[]
  onOpenPairModal: (terminal: TerminalDevice) => void
  onRevoke: (terminalId: string) => void
}

export function TerminalTable({ terminals, onOpenPairModal, onRevoke }: TerminalTableProps) {
  const getStatusBadge = (status: TerminalDevice['status']) => {
    switch (status) {
      case 'online':
        return (
          <Badge variant="success" showDot pulseDot>
            Online
          </Badge>
        )
      case 'offline':
        return (
          <Badge variant="danger" showDot>
            Offline
          </Badge>
        )
      case 'unpaired':
        return (
          <Badge variant="neutral" showDot>
            Unpaired
          </Badge>
        )
    }
  }

  if (terminals.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7c007e] border border-purple-100 flex items-center justify-center mx-auto mb-3">
          <Laptop size={24} />
        </div>
        <h3 className="text-sm font-bold text-zinc-900 mb-1">No Kiosk Terminals Found</h3>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          No hardware kiosks are provisioned in your database for this workspace yet. Click <span className="font-semibold text-zinc-800">"Provision Terminal"</span> above to register your first station.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50/50 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            <th className="py-3.5 px-5">Terminal Station</th>
            <th className="py-3.5 px-4">Location & Dept</th>
            <th className="py-3.5 px-4">Mode</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4">Telemetry</th>
            <th className="py-3.5 px-5 text-right">Device Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 text-sm">
          {terminals.map((t) => (
            <tr key={t.id} className="hover:bg-zinc-50/60 transition-colors">
              <td className="py-4 px-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#7c007e] flex items-center justify-center shrink-0 border border-purple-100">
                    <Laptop size={18} />
                  </div>
                  <div>
                    <span className="font-bold text-zinc-900 block leading-tight">{t.name}</span>
                    <span className="text-[11px] font-mono text-zinc-400">ID: {t.id}</span>
                  </div>
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="text-zinc-800 text-xs font-medium">{t.location}</div>
                {t.departmentName && (
                  <span className="text-[11px] text-zinc-400">{t.departmentName}</span>
                )}
              </td>
              <td className="py-4 px-4">
                <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700">
                  {t.mode}
                </span>
              </td>
              <td className="py-4 px-4">{getStatusBadge(t.status)}</td>
              <td className="py-4 px-4">
                {t.status === 'online' ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                    <Wifi size={14} />
                    <span>Active Heartbeat</span>
                  </div>
                ) : t.status === 'offline' ? (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <WifiOff size={14} />
                    <span>No response</span>
                  </div>
                ) : (
                  <span className="text-xs text-amber-600 font-medium">Pending Setup</span>
                )}
                {t.lastIpAddress && (
                  <span className="block text-[10px] font-mono text-zinc-400 mt-0.5">
                    IP: {t.lastIpAddress}
                  </span>
                )}
              </td>
              <td className="py-4 px-5 text-right">
                <div className="flex items-center justify-end gap-2">
                  {t.status === 'unpaired' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<QrCode size={14} />}
                      onClick={() => onOpenPairModal(t)}
                    >
                      Pair Code
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      leftIcon={<ShieldAlert size={14} />}
                      onClick={() => onRevoke(t.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
