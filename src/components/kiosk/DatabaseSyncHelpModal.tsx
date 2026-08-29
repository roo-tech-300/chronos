import { useState } from 'react'
import { Database, Check, Copy, X, ShieldAlert } from 'lucide-react'

interface DatabaseSyncHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

const SUPABASE_SQL_MIGRATION = `-- =========================================================
-- CHRONOS: ENABLE BIOMETRIC ATTENDANCE LOGGING IN SUPABASE
-- Run this in your Supabase Project -> SQL Editor
-- =========================================================

-- 1. Create table if not exists
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    member_id UUID NOT NULL,
    terminal_id TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
    scan_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verification_mode TEXT NOT NULL DEFAULT 'biometric_fs80h',
    confidence_score INTEGER NOT NULL DEFAULT 98,
    status TEXT NOT NULL DEFAULT 'verified',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- 3. Allow Kiosk Terminals & Authenticated Users to Insert & Read Logs
DROP POLICY IF EXISTS "Allow public attendance scan inserts" ON public.attendance_logs;
CREATE POLICY "Allow public attendance scan inserts"
    ON public.attendance_logs
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 4. Allow Biometric Templates read & write
ALTER TABLE public.biometric_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow biometric templates access" ON public.biometric_templates;
CREATE POLICY "Allow biometric templates access"
    ON public.biometric_templates
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
`

export function DatabaseSyncHelpModal({ isOpen, onClose }: DatabaseSyncHelpModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SQL_MIGRATION)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#7c007e] border border-purple-100 flex items-center justify-center">
              <Database size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Database Persistence Setup</h2>
              <p className="text-xs text-zinc-500">Supabase Table Schema & RLS Policy</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="my-5 space-y-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
            <ShieldAlert size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Supabase Row-Level Security:</span> To allow hardware terminal kiosks to save scans directly into Supabase without blocking on RLS, run this SQL script in your Supabase SQL Editor once.
            </div>
          </div>

          <div className="relative">
            <pre className="p-4 rounded-2xl bg-zinc-900 text-zinc-200 font-mono text-[11px] max-h-48 overflow-y-auto leading-relaxed select-all">
              {SUPABASE_SQL_MIGRATION}
            </pre>
            <button
              type="button"
              onClick={handleCopy}
              className="absolute top-2 right-2 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copied ? 'Copied SQL!' : 'Copy SQL'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Got it, thanks
          </button>
        </div>
      </div>
    </div>
  )
}
