-- ============================================================================
-- Migration: 20260907_tasks_drop_unused_columns.sql
-- Purpose: Remove unused task fields so the schema mirrors the actual app:
--   priority, sub_department, is_today, estimated_mins, actual_mins,
--   difficulty_note, completion_links.
--
-- NOTE: get_member_task_brief (kiosk RPC) reads priority + is_today, so it is
-- recreated here with a smaller signature BEFORE the columns are dropped
-- (drop function first because the return type changes).
-- ============================================================================

-- 1. Recreate the kiosk brief RPC without priority / is_today
drop function if exists public.get_member_task_brief(uuid, uuid, text);

create or replace function public.get_member_task_brief(
  p_member_id uuid,
  p_workspace_id uuid,
  p_device_token text
)
returns table (
  total_tasks integer,
  open_tasks integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_terminal_workspace uuid;
begin
  select k.workspace_id
    into v_terminal_workspace
    from public.kiosks k
   where k.device_token = p_device_token
   limit 1;

  if v_terminal_workspace is null or v_terminal_workspace is distinct from p_workspace_id then
    return query select 0::integer, 0::integer;
    return;
  end if;

  return query
    select
      count(*)::integer,
      count(*) filter (where t.status <> 'approved')::integer
    from public.tasks t
   where t.assignee_member_id = p_member_id
     and t.workspace_id = p_workspace_id;
end;
$$;

revoke all on function public.get_member_task_brief(uuid, uuid, text) from public;
grant execute on function public.get_member_task_brief(uuid, uuid, text) to anon, authenticated;

-- 2. Drop the unused columns (dependent CHECK constraints drop automatically;
--    none of the remaining indexes reference these columns)
alter table public.tasks
  drop column if exists priority,
  drop column if exists sub_department,
  drop column if exists is_today,
  drop column if exists estimated_mins,
  drop column if exists actual_mins,
  drop column if exists difficulty_note,
  drop column if exists completion_links;
