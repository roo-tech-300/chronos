-- ==============================================================================
-- MIGRATION: 20260904_org_unit_members_rpcs.sql
-- Description: Updates hierarchical authority RPCs to support M:N unit assignments
--              via organization_unit_members and optional unit context.
-- ==============================================================================

-- Function 1: Subordinate members across both primary and secondary assignments
create or replace function public.get_subordinate_member_ids(p_leader_member_id uuid)
returns table(member_id uuid)
language plpgsql
stable
set search_path = public
as $$
begin
  return query
  select distinct m.id
  from public.workspace_members m
  where m.id = p_leader_member_id
     -- Legacy / primary cache check
     or exists (
       select 1
       from public.organization_units headed
       join public.organization_units sub
         on sub.workspace_id = headed.workspace_id
        and sub.path <@ headed.path
       where headed.head_member_id = p_leader_member_id
         and m.unit_id = sub.id
     )
     -- M:N junction table check (all assignments: primary, joint, adjunct, etc.)
     or exists (
       select 1
       from public.organization_unit_members oum
       join public.organization_units headed
         on headed.workspace_id = oum.workspace_id
        and headed.head_member_id = p_leader_member_id
       join public.organization_units sub
         on sub.id = oum.unit_id
        and sub.path <@ headed.path
       where oum.member_id = m.id
     );
end;
$$;

-- Function 2: Authority check with optional unit context
create or replace function public.can_manage_member(
  p_manager_member_id uuid,
  p_target_member_id  uuid,
  p_context_unit_id   uuid default null
)
returns boolean
language plpgsql
stable
set search_path = public
as $$
declare
  v_is_authorized boolean := false;
begin
  -- 1. Self is always authorized
  if p_manager_member_id = p_target_member_id then
    return true;
  end if;

  -- 2. Direct reports_to relationship
  if exists (
    select 1 from public.workspace_members
    where id = p_target_member_id and reports_to = p_manager_member_id
  ) or exists (
    select 1 from public.organization_unit_members
    where member_id = p_target_member_id and reports_to = p_manager_member_id
  ) then
    return true;
  end if;

  -- 3. If context unit is provided, verify manager heads that unit or its ancestor
  if p_context_unit_id is not null then
    select exists (
      select 1
      from public.organization_units target_unit
      join public.organization_units headed
        on headed.workspace_id = target_unit.workspace_id
       and headed.head_member_id = p_manager_member_id
       and target_unit.path <@ headed.path
      where target_unit.id = p_context_unit_id
    ) into v_is_authorized;

    return coalesce(v_is_authorized, false);
  end if;

  -- 4. Global fallback: manager heads ANY unit that the target is assigned to
  select exists (
    select 1
    from public.organization_unit_members oum
    join public.organization_units target_unit on target_unit.id = oum.unit_id
    join public.organization_units headed
      on headed.workspace_id = target_unit.workspace_id
     and headed.head_member_id = p_manager_member_id
     and target_unit.path <@ headed.path
    where oum.member_id = p_target_member_id
  ) or exists (
    -- Fallback to workspace_members.unit_id cache
    select 1
    from public.workspace_members target_member
    join public.organization_units target_unit on target_unit.id = target_member.unit_id
    join public.organization_units headed
      on headed.workspace_id = target_unit.workspace_id
     and headed.head_member_id = p_manager_member_id
     and target_unit.path <@ headed.path
    where target_member.id = p_target_member_id
  ) into v_is_authorized;

  return coalesce(v_is_authorized, false);
end;
$$;
