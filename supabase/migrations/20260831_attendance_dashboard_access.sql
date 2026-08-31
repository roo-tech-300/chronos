-- Migration: 20260831_attendance_dashboard_access.sql
-- Description: Ensure attendance_logs has optimal indexes and RLS policies for dashboard volume and live headcount queries

-- 1. Index on organization_id and scan_timestamp for high-performance period range queries
CREATE INDEX IF NOT EXISTS idx_attendance_logs_org_scan_ts 
    ON public.attendance_logs (organization_id, scan_timestamp DESC);

-- 2. Index on member_id and scan_timestamp for latest state resolution
CREATE INDEX IF NOT EXISTS idx_attendance_logs_member_scan_ts 
    ON public.attendance_logs (member_id, scan_timestamp DESC);

-- 3. Ensure SELECT policies allow authenticated users and kiosk anon clients to query attendance logs for dashboards
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow anon read attendance logs" ON public.attendance_logs;
    DROP POLICY IF EXISTS "Allow authenticated read attendance logs" ON public.attendance_logs;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Allow anon read attendance logs"
    ON public.attendance_logs
    FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Allow authenticated read attendance logs"
    ON public.attendance_logs
    FOR SELECT
    TO authenticated
    USING (true);
