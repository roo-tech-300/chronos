-- ============================================================================
-- Migration: 20260907_tasks_due_rules.sql
-- Purpose: Aligns public.tasks with the simplified "Create Task" flow:
--
--   1. Priority   -> the modal no longer collects it; give the column a
--                    server default ('medium') so inserts may omit it.
--   2. due_date   -> the modal now writes human-readable strings
--                    ("Every Weekday", "Every Thursday",
--                     "Every first Monday of the month", "Today, 05:00 PM").
--                    TIMESTAMPTZ cannot hold those, so the column becomes
--                    TEXT. (The TS row type and all cards already treat it
--                    as a string; only the DB column changes.)
--   3. recurrence -> constrained to the new vocabulary: NULL | 'daily' |
--                    'weekly' | 'monthly'. Legacy free-text rows (e.g. the
--                    old "Every weekday at 08:30 AM" style) are nulled out
--                    first so the check constraint can be applied.
--
-- Safe to re-run: the type swap is guarded; every other statement is
-- idempotent. Run times are low (tasks table is small).
-- ============================================================================

-- -------------------------------------------------------------
-- 1. Priority: server default, so the app no longer has to send it
-- -------------------------------------------------------------
alter table public.tasks
  alter column priority set default 'medium';

-- -------------------------------------------------------------
-- 2. due_date: TIMESTAMPTZ -> TEXT (human-readable due rule)
-- -------------------------------------------------------------
-- The type swap depends on the old column type, so guard it for re-runs.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tasks'
      and column_name = 'due_date'
      and data_type = 'timestamp with time zone'
  ) then
    -- Existing timestamps become readable text (e.g. '2026-09-07 09:00')
    -- instead of raw ISO strings. NULL-ability (NOT NULL) is preserved.
    alter table public.tasks
      alter column due_date type text
      using to_char(due_date, 'YYYY-MM-DD HH24:MI');
  end if;
end $$;

-- Rebuild the (workspace_id, due_date) ordering index on the new type.
-- The old index was dropped implicitly by the type swap; this recreates it
-- explicitly so the common workspace task listing stays indexed.
create index if not exists idx_tasks_workspace_due
  on public.tasks (workspace_id, due_date desc);

-- -------------------------------------------------------------
-- 3. recurrence: normalize legacy rows, then enforce the vocabulary
-- -------------------------------------------------------------
update public.tasks
set recurrence = null
where recurrence is not null
  and btrim(recurrence) not in ('daily', 'weekly', 'monthly');

alter table public.tasks
  drop constraint if exists tasks_recurrence_check,
  add constraint tasks_recurrence_check
  check (recurrence is null or recurrence in ('daily', 'weekly', 'monthly'));

-- -------------------------------------------------------------
-- 4. type stays ('recurring' | 'special')  -- no change required:
--    one_off -> special, daily/weekly/monthly -> recurring
-- -------------------------------------------------------------

-- Sanity check you can run after applying:
--   select type, recurrence, due_date
--   from public.tasks
--   order by created_at desc
--   limit 20;
-- ============================================================================