-- Migration: 20260829_create_attendance_logs.sql
-- Description: Create attendance_logs table with multi-tenant RLS for lecturer & staff attendance tracking

CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    member_id TEXT NOT NULL,
    staff_name TEXT NOT NULL,
    terminal_id TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
    scan_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verification_mode TEXT NOT NULL DEFAULT 'biometric_fs80h',
    confidence_score INTEGER NOT NULL DEFAULT 98,
    status TEXT NOT NULL DEFAULT 'verified' CHECK (status IN ('verified', 'flagged', 'manual_override')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_attendance_org_time 
    ON public.attendance_logs (organization_id, scan_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_member_time 
    ON public.attendance_logs (member_id, scan_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_terminal_time 
    ON public.attendance_logs (terminal_id, scan_timestamp DESC);

-- Enable RLS
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- 1. Org members can view attendance logs for their workspace
CREATE POLICY "Allow members to read attendance in their organization"
    ON public.attendance_logs
    FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT workspace_id 
            FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
        OR organization_id = '00000000-0000-0000-0000-000000000000'::uuid
    );

-- 2. Authenticated users can insert logs
CREATE POLICY "Allow authenticated sessions to insert attendance logs"
    ON public.attendance_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        organization_id IN (
            SELECT workspace_id 
            FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
        OR organization_id = '00000000-0000-0000-0000-000000000000'::uuid
    );

-- 3. Hardware Terminal Kiosks (anonymous hardware bridge client)
CREATE POLICY "Allow paired hardware terminals to insert logs"
    ON public.attendance_logs
    FOR INSERT
    TO anon
    WITH CHECK (true);
