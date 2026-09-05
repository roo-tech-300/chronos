-- Adds the attendance telemetry tables to the Supabase realtime publication.
-- Without this, useRealtimeAttendance subscribes successfully but NEVER
-- receives postgres_changes events (silent dead subscription).
-- RLS is still enforced for realtime delivery: authenticated subscribers only
-- receive rows their SELECT policies permit.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'attendance_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_logs;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'kiosks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kiosks;
  END IF;
END
$$;