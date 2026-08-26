import { CheckCircle2, Shield, Key } from 'lucide-react'
import type { WorkspaceDraft } from '../../../types/workspaces'
import { BrandCardPreview } from '../BrandCardPreview'

interface StepReviewProps {
  draft: WorkspaceDraft
}

export function StepReview({ draft }: StepReviewProps) {
  return (
    <div className="space-y-4">
      <BrandCardPreview draft={draft} />

      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-2 text-xs">
        <div className="flex items-center justify-between text-zinc-700">
          <span className="flex items-center gap-1.5 text-zinc-500">
            <Shield size={14} className="text-zinc-400" />
            Assigned Permissions
          </span>
          <span className="font-semibold text-zinc-900">Owner & Root Admin</span>
        </div>
        <div className="flex items-center justify-between text-zinc-700">
          <span className="flex items-center gap-1.5 text-zinc-500">
            <Key size={14} className="text-zinc-400" />
            Biometric Security Core
          </span>
          <span className="font-semibold text-emerald-700">Encrypted SHA-256</span>
        </div>
      </div>

      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-xs leading-relaxed">
        <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0 mt-0.5" />
        <p>
          Once created, you will be able to register physical terminal kiosks, configure departments, and enroll biometric identities.
        </p>
      </div>
    </div>
  )
}
