import { useState } from 'react'
import { Database, Check, Copy, X, ShieldAlert } from 'lucide-react'

interface DatabaseSyncHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

const SUPABASE_SQL_MIGRATION = `-- =========================================================
-- CHRONOS: ENABLE ATTENDANCE LOGGING & RLS IN SUPABASE
-- Run this in your Supabase Project -> SQL Editor
-- =========================================================

-- 1. Create table matching exact DDL schema
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::UUID,
    member_id TEXT NOT NULL,
    terminal_id TEXT NOT NULL,
    direction TEXT NOT NULL,
    scan_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    verification_mode TEXT NOT NULL DEFAULT 'biometric_fs80h'::TEXT,
    confidence_score INTEGER NOT NULL DEFAULT 98,
    status TEXT NOT NULL DEFAULT 'verified'::TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT attendance_logs_pkey PRIMARY KEY (id),
    CONSTRAINT attendance_logs_direction_check CHECK (
        (direction = ANY (ARRAY['in'::TEXT, 'out'::TEXT]))
    ),
    CONSTRAINT attendance_logs_status_check CHECK (
        (status = ANY (ARRAY['verified'::TEXT, 'flagged'::TEXT, 'manual_override'::TEXT]))
    )
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_member_day ON public.attendance_logs USING btree (member_id, scan_timestamp desc);
CREATE INDEX IF NOT EXISTS idx_attendance_org_time ON public.attendance_logs USING btree (organization_id, scan_timestamp desc);
CREATE INDEX IF NOT EXISTS idx_attendance_member_time ON public.attendance_logs USING btree (member_id, scan_timestamp desc);
CREATE INDEX IF NOT EXISTS idx_attendance_terminal_time ON public.attendance_logs USING btree (terminal_id, scan_timestamp desc);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- 4. Allow Terminals and Users to insert and query attendance logs
DROP POLICY IF EXISTS "Allow public attendance scan inserts" ON public.attendance_logs;
CREATE POLICY "Allow public attendance scan inserts"
    ON public.attendance_logs
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
              <h2 className="text-base font-bold text-zinc-900">Database Schema & RLS</h2>
              <p className="text-xs text-zinc-500">public.attendance_logs</p>
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
              <span className="font-bold">Row-Level Security (RLS) Policy:</span> Run the policy script in your Supabase SQL Editor to allow the kiosk to insert verified scan rows.
            </div>
          </div>

          <div className="relative">
            <pre className="p-4 rounded-2xl bg-zinc-900 text-zinc-200 font-mono text-[11px] max-h-52 overflow-y-auto leading-relaxed select-all">
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
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
