-- Task Brief RPC for paired kiosks (anon key, no user session).
--
-- The `tasks` table SELECT policy is authenticated-only, so a kiosk cannot
-- read task rows directly. Rather than opening an anon SELECT policy on
-- `tasks` (which would leak assignment data to anyone holding the anon key),
-- this SECURITY DEFINER RPC validates the kiosk's device token against
-- `public.kiosks` and returns ONLY aggregate counts - no task content, no
-- staff PII. Mirrors the kiosk identity RPC pattern from migration 20260831.

create or replace function public.get_member_task_brief(
  p_member_id uuid,
  p_workspace_id uuid,
  p_device_token text
)
returns table (
  total_tasks integer,
  open_tasks integer,
  high_priority_tasks integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_terminal_workspace uuid;
begin
  -- Validate the kiosk device token and require it to be paired to the same
  -- workspace the brief is requested for (prevents cross-tenant reads).
  select k.workspace_id
    into v_terminal_workspace
    from public.kiosks k
   where k.device_token = p_device_token
   limit 1;

  if v_terminal_workspace is null or v_terminal_workspace is distinct from p_workspace_id then
    -- Invalid, unknown, or cross-tenant token: return zeros (graceful, no leak).
    return query select 0::integer, 0::integer, 0::integer;
    return;
  end if;

  return query
    select
      count(*)::integer,
      count(*) filter (where t.status <> 'approved')::integer,
      count(*) filter (where t.priority = 'high' and t.status <> 'approved')::integer
    from public.tasks t
   where t.assignee_member_id = p_member_id
     and t.workspace_id = p_workspace_id
     and t.is_today = true;
end;
$$;

-- Lock down execution: kiosk hardware (anon) and dashboards (authenticated) only.
revoke all on function public.get_member_task_brief(uuid, uuid, text) from public;
grant execute on function public.get_member_task_brief(uuid, uuid, text) to anon, authenticated;
