import { Building2, ShieldCheck, Users, Radio } from 'lucide-react'
import type { WorkspaceDraft } from '../../types/workspaces'

interface BrandCardPreviewProps {
  draft: WorkspaceDraft
}

export function BrandCardPreview({ draft }: BrandCardPreviewProps) {
  const accent = draft.accentColor || '#4f46e5'
  const displayName = draft.name.trim() || 'Your Organization'

  return (
    <div className="bg-zinc-50/70 border border-zinc-200/80 rounded-2xl p-4.5 transition-all">
      <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">
        <span>Live Interface Preview</span>
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
          <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: accent }} />
          {accent.toUpperCase()}
        </span>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: accent }} />

        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-xs overflow-hidden flex-shrink-0 transition-colors"
              style={{ backgroundColor: accent }}
            >
              {draft.avatarUrl ? (
                <img src={draft.avatarUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 size={22} className="text-white" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-900 leading-snug">{displayName}</h4>
              <p className="text-[11px] text-zinc-400">Physical Identity & Terminal Control</p>
            </div>
          </div>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{ backgroundColor: `${accent}18`, color: accent }}
          >
            {draft.category || 'Technology'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-500 pt-2 border-t border-zinc-100">
          <div className="flex items-center gap-1">
            <Users size={14} className="text-zinc-400" />
            <span>1 Member (You)</span>
          </div>
          <div className="flex items-center gap-1">
            <Radio size={14} className="text-zinc-400" />
            <span>0 Kiosks</span>
          </div>
          <div className="flex items-center gap-1 ml-auto text-[11px] font-medium text-emerald-600">
            <ShieldCheck size={14} />
            <span>Admin</span>
          </div>
        </div>
      </div>
    </div>
  )
}
