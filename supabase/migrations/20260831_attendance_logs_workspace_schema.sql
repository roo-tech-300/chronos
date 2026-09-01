-- Migration: 20260831_attendance_logs_workspace_schema.sql
-- Description: Aligns attendance_logs with the workspace-scoped production schema:
--   workspace_id UUID NOT NULL (FK workspaces)   [replaces organization_id]
--   member_id   UUID NOT NULL (FK workspace_members.id)  [was TEXT]
--   terminal_id UUID NULL (FK kiosks.id)         [was TEXT NOT NULL]
--   staff_name  removed (identity joins through workspace_members)
-- The production database already has this shape (no-op there). Legacy-shaped
-- environments (organization_id column still present) are rebuilt - those are dev
-- databases whose old buffered logs are not authoritative records.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'attendance_logs'
      AND column_name = 'organization_id'
  ) THEN
    RAISE NOTICE 'Legacy attendance_logs shape detected - rebuilding with workspace-scoped schema';
    DROP TABLE public.attendance_logs CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id uuid not null default gen_random_uuid (),
    workspace_id uuid not null,
    member_id uuid not null,
    terminal_id uuid null,
    direction text not null,
    scan_timestamp timestamp with time zone not null default now(),
    verification_mode text not null default 'biometric_fs80h'::text,
    confidence_score integer not null default 98,
    status text not null default 'verified'::text,
    created_at timestamp with time zone not null default now(),
    constraint attendance_logs_pkey primary key (id),
    constraint attendance_logs_member_id_fkey foreign KEY (member_id) references workspace_members (id) on delete CASCADE,
    constraint attendance_logs_terminal_id_fkey foreign KEY (terminal_id) references kiosks (id) on delete set null,
    constraint attendance_logs_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id) on delete CASCADE,
    constraint attendance_logs_direction_check check (
        (direction = any (array['in'::text, 'out'::text]))
    ),
    constraint attendance_logs_status_check check (
        (status = any (array['verified'::text, 'flagged'::text, 'manual_override'::text]))
    )
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_attendance_member_day
    ON public.attendance_logs USING btree (member_id, scan_timestamp DESC) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_attendance_workspace_time
    ON public.attendance_logs USING btree (workspace_id, scan_timestamp DESC) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_attendance_member_time
    ON public.attendance_logs USING btree (member_id, scan_timestamp DESC) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_attendance_terminal_time
    ON public.attendance_logs USING btree (terminal_id, scan_timestamp DESC) TABLESPACE pg_default;

-- Legacy organization-based artifacts (safe no-ops when absent)
DROP INDEX IF EXISTS public.idx_attendance_org_time;
DROP INDEX IF EXISTS public.idx_attendance_logs_org_scan_ts;
DROP POLICY IF EXISTS "Allow members to read attendance in their organization" ON public.attendance_logs;
DROP POLICY IF EXISTS "Allow authenticated sessions to insert attendance logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Allow paired hardware terminals to insert logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Allow anon read attendance logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Allow authenticated read attendance logs" ON public.attendance_logs;

-- RLS
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- 1. Workspace members read their own workspace's logs (dashboards, reports)
CREATE POLICY "Allow workspace members to read attendance logs"
    ON public.attendance_logs
    FOR SELECT
    TO authenticated
    USING (
        workspace_id IN (
            SELECT workspace_id
            FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    );

-- 2. Workspace members record scans from authenticated dashboard flows
CREATE POLICY "Allow workspace members to record attendance"
    ON public.attendance_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id
            FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    );

-- 3. Paired hardware kiosks record scans with the anon key (no user session)
CREATE POLICY "Allow paired kiosks to record attendance"
    ON public.attendance_logs
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- 4. Kiosk dashboards read the live feed with the anon key
--    NOTE: deliberately broad to preserve kiosk-mode behaviour - tightening via
--    device-token claims belongs to a future pass.
CREATE POLICY "Allow kiosk dashboards to read attendance logs"
    ON public.attendance_logs
    FOR SELECT
    TO anon
    USING (true);
