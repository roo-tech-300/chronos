import { CheckCircle2 } from 'lucide-react'

interface PairingSuccessCardProps {
  terminalName: string
}

export function PairingSuccessCard({ terminalName }: PairingSuccessCardProps) {
  return (
    <div className="bg-white border border-emerald-200 rounded-3xl p-8 sm:p-10 text-center shadow-lg shadow-emerald-500/5 animate-in zoom-in-95 duration-200">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 size={36} />
      </div>
      <h2 className="text-xl font-bold text-zinc-900 mb-1">Device Paired Successfully!</h2>
      <p className="text-sm text-[#7c007e] font-bold mb-2">{terminalName}</p>
      <p className="text-xs text-zinc-500">
        Permanent cryptographic token saved to this machine. Redirecting to Scanner...
      </p>
    </div>
  )
}
