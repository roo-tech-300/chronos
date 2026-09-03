-- ==============================================================================
-- MIGRATION: 20260903_organization_units.sql
-- Hierarchical Organization Units with ltree lineage tracking
--
-- Corrections applied vs. the draft roadmap (IMPORTANT):
--   1. CASCADE FIX: the draft's "after update of path" trigger would never
--      fire (Postgres only fires "UPDATE OF col" when col is in the statement's
--      SET list, and nothing ever SETs path directly). The maintain trigger is
--      now an unconditional BEFORE INSERT OR UPDATE, and the cascade trigger is
--      a plain AFTER UPDATE guarded by a path-change check.
--   2. Cycle guard: a unit can never be moved under its own descendant.
--   3. Cross-workspace safety: authority joins match workspace_id explicitly
--      (two workspaces can contain identical path strings).
--   4. get_subordinate_member_ids: honours ALL units a member heads (draft had
--      "limit 1") and always includes the leader themselves.
--   5. unit_type now has a CHECK constraint (matches house schema style).
--   6. ancestor_ids includes the unit's OWN id (documented) so
--      "ancestor_ids @> ARRAY[unit_id]" matches the full subtree incl. self.
--   7. get_unit_subtree_ids() RPC: PostgREST/supabase-js cannot express
--      "path <@" operators, so subtree fetches go through this RPC.
--   8. Policy drops are idempotent so the script can be re-run safely.
--   9. Section 8 (OPTIONAL) enforces task approval authority at the DB level.
--
-- NOTE: deleting a unit cascades to its whole subtree (parent_id ON DELETE
-- CASCADE). The UI must confirm before destructive deletes.
-- ==============================================================================

-- ==============================================================================
-- 1. EXTENSIONS
-- ==============================================================================
create extension if not exists ltree;

-- ==============================================================================
-- 2. ORGANIZATION_UNITS TABLE
-- ==============================================================================
create table if not exists public.organization_units (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  parent_id uuid references public.organization_units(id) on delete cascade,

  name text not null,
  code text not null, -- clean alphanumeric identifier, e.g. "SICT", "CS", "IOT"
  unit_type text not null default 'department'
    check (unit_type in ('institution', 'directorate', 'faculty', 'division', 'department', 'unit', 'lab', 'office')),

  -- The head/lead of this unit (Dean, HOD, Director, Lab Lead)
  head_member_id uuid references public.workspace_members(id) on delete set null,

  -- Hierarchical path columns for instant sub-tree lookup
  path ltree,
  ancestor_ids uuid[] not null default '{}', -- all ancestors INCLUDING self

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  constraint uq_unit_workspace_code unique (workspace_id, code)
);

-- Indexes for sub-tree matching, ancestor queries and head lookups
create index if not exists idx_org_units_workspace on public.organization_units (workspace_id);
create index if not exists idx_org_units_parent on public.organization_units (parent_id);
create index if not exists idx_org_units_path on public.organization_units using gist (path);
create index if not exists idx_org_units_ancestors on public.organization_units using gin (ancestor_ids);
create index if not exists idx_org_units_head on public.organization_units (head_member_id);

-- ==============================================================================
-- 3. LINK WORKSPACE_MEMBERS TO UNITS & SUPERVISORS
--    (the existing free-text department column stays for transition)
-- ==============================================================================
alter table public.workspace_members
  add column if not exists unit_id uuid references public.organization_units(id) on delete set null,
  add column if not exists reports_to uuid references public.workspace_members(id) on delete set null,
  add column if not exists job_title text;

create index if not exists idx_workspace_members_unit on public.workspace_members (unit_id);
create index if not exists idx_workspace_members_reports_to on public.workspace_members (reports_to);

-- ==============================================================================
-- 4. TRIGGER: AUTOMATIC PATH & ANCESTOR MAINTENANCE
--    Runs on EVERY write so path / ancestor_ids / updated_at are always
--    derived server-side (clients can never forge a path).
-- ==============================================================================
create or replace function public.maintain_organization_unit_path()
returns trigger as $$
declare
  clean_code text;
  parent_rec record;
begin
  -- Sanitize code into a valid ltree token (alphanumeric + underscores only)
  clean_code := regexp_replace(upper(trim(new.code)), '[^A-Z0-9_]', '_', 'g');
  if clean_code = '' then
    clean_code := 'U_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  if new.parent_id is null then
    -- Root unit
    new.path := text2ltree(clean_code);
    new.ancestor_ids := array[new.id];
  else
    -- Fetch parent's computed path and ancestors
    select path, ancestor_ids
    into parent_rec
    from public.organization_units
    where id = new.parent_id;

    if not found then
      raise exception 'Parent unit % does not exist', new.parent_id;
    end if;

    -- Cycle guard: never allow a unit under its own descendant (or itself)
    if new.id = any(parent_rec.ancestor_ids) then
      raise exception 'Cannot move unit % under its own descendant', new.id;
    end if;

    if parent_rec.path is null then
      new.path := text2ltree(clean_code);
      new.ancestor_ids := array[new.id];
    else
      new.path := parent_rec.path || text2ltree(clean_code);
      new.ancestor_ids := parent_rec.ancestor_ids || new.id;
    end if;
  end if;

  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_maintain_org_unit_path on public.organization_units;

create trigger trg_maintain_org_unit_path
before insert or update on public.organization_units
for each row execute function public.maintain_organization_unit_path();

-- ==============================================================================
-- 5. TRIGGER: CASCADE PATH UPDATES WHEN A PARENT MOVES OR CHANGES CODE
--    Plain "after update" + path-change guard. Fires whenever the BEFORE
--    trigger (re)computed a different path, at every depth, recursively.
-- ==============================================================================
create or replace function public.cascade_organization_unit_path_updates()
returns trigger as $$
begin
  if (old.path is distinct from new.path) then
    -- Re-write parent_id to re-fire maintain_organization_unit_path on every
    -- child, which recomputes their path/ancestors and recurses further down.
    update public.organization_units
    set parent_id = parent_id
    where parent_id = new.id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_cascade_org_unit_path on public.organization_units;

create trigger trg_cascade_org_unit_path
after update on public.organization_units
for each row execute function public.cascade_organization_unit_path_updates();

-- ==============================================================================
-- 6. HELPER FUNCTIONS FOR SUBTREE & AUTHORITY LOOKUPS
-- ==============================================================================

-- Function A: All unit IDs in the subtree of a unit (inclusive of itself).
-- Callable from the client via supabase.rpc() because PostgREST cannot
-- express "path <@" operators directly.
create or replace function public.get_unit_subtree_ids(p_unit_id uuid)
returns table(unit_id uuid)
language sql
stable
set search_path = public
as $$
  select child.id
  from public.organization_units child
  join public.organization_units root on root.id = p_unit_id
  where child.workspace_id = root.workspace_id
    and child.path <@ root.path;
$$;

-- Function B: All member IDs managed by a leader: themselves, everyone in any
-- unit they head, and everyone in any unit BELOW those units (ltree subtree).
create or replace function public.get_subordinate_member_ids(p_leader_member_id uuid)
returns table(member_id uuid)
language plpgsql
stable
set search_path = public
as $$
begin
  return query
  select m.id
  from public.workspace_members m
  where m.id = p_leader_member_id
     or exists (
       select 1
       from public.organization_units headed
       join public.organization_units sub
         on sub.workspace_id = headed.workspace_id
        and sub.path <@ headed.path
       where headed.head_member_id = p_leader_member_id
         and m.unit_id = sub.id
     );
end;
$$;

-- Function C: Boolean check if Member A has hierarchical authority over
-- Member B. Order: self -> direct reports_to -> ltree subtree of any unit
-- A heads.
create or replace function public.can_manage_member(
  p_manager_member_id uuid,
  p_target_member_id uuid
)
returns boolean
language plpgsql
stable
set search_path = public
as $$
declare
  v_is_authorized boolean;
begin
  -- 1. Self
  if p_manager_member_id = p_target_member_id then
    return true;
  end if;

  -- 2. Direct reports_to relationship
  if exists (
    select 1 from public.workspace_members
    where id = p_target_member_id and reports_to = p_manager_member_id
  ) then
    return true;
  end if;

  -- 3. Hierarchical: target's unit is within the subtree of any unit the
  --    manager heads (workspace_id match prevents cross-workspace leaks).
  select exists (
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

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
alter table public.organization_units enable row level security;

drop policy if exists "Members can view workspace organization units" on public.organization_units;
create policy "Members can view workspace organization units"
  on public.organization_units
  for select
  to authenticated
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = organization_units.workspace_id
        and wm.user_id = auth.uid()
    )
  );

-- Admins/owners only. Unit-head subtree management can be added later via a
-- dedicated policy using head_member_id / can_manage_member.
drop policy if exists "Workspace admins can manage organization units" on public.organization_units;
create policy "Workspace admins can manage organization units"
  on public.organization_units
  for all
  to authenticated
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = organization_units.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = organization_units.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );

-- ==============================================================================
-- 8. OPTIONAL (RECOMMENDED): TASK APPROVAL ENFORCEMENT
--    Today ANY workspace member can set tasks.status = 'approved' directly
--    (the 20260901 update policy is permissive). This section adds
--    verified_by_member_id attribution, a safe approval RPC, and tightens the
--    update policy so approvals require owner/admin or can_manage_member().
--    Run this section only if you want DB-enforced approvals now.
-- ==============================================================================

-- 8a. Attribution column (keeps the legacy verified_by text for old rows)
alter table public.tasks
  add column if not exists verified_by_member_id uuid references public.workspace_members(id) on delete set null;

create index if not exists idx_tasks_verified_by on public.tasks (verified_by_member_id);

-- 8b. Safe approval entry point for the frontend
create or replace function public.approve_task_if_authorized(p_task_id uuid)
returns setof public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.tasks%rowtype;
  v_caller public.workspace_members%rowtype;
begin
  select * into v_task from public.tasks where id = p_task_id;
  if not found then
    raise exception 'Task % not found', p_task_id;
  end if;

  select * into v_caller from public.workspace_members
  where workspace_id = v_task.workspace_id
    and user_id = auth.uid();
  if not found then
    raise exception 'You are not a member of this workspace';
  end if;

  if v_caller.role not in ('owner', 'admin')
     and not public.can_manage_member(v_caller.id, v_task.assignee_member_id) then
    raise exception 'You do not have approval authority over this task assignee';
  end if;

  return query
  update public.tasks
  set status = 'approved',
      verified_by_member_id = v_caller.id,
      verified_by = coalesce(
        (select p.full_name from public.profiles p where p.id = v_caller.user_id),
        v_task.verified_by
      )
  where id = p_task_id
  returning *;
end;
$$;

revoke execute on function public.approve_task_if_authorized(uuid) from anon, public;
grant execute on function public.approve_task_if_authorized(uuid) to authenticated;

-- 8c. Tighten the tasks update policy: normal task edits stay open to all
--     workspace members, but moving a task INTO 'approved' now requires
--     owner/admin or hierarchical authority over the assignee.
drop policy if exists "Users can update tasks in their workspace" on public.tasks;
create policy "Users can update tasks in their workspace"
  on public.tasks
  for update
  to authenticated
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = tasks.workspace_id
        and wm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = tasks.workspace_id
        and wm.user_id = auth.uid()
    )
    and (
      tasks.status is distinct from 'approved'
      or exists (
        select 1 from public.workspace_members wm
        where wm.workspace_id = tasks.workspace_id
          and wm.user_id = auth.uid()
          and (
            wm.role in ('owner', 'admin')
            or public.can_manage_member(wm.id, tasks.assignee_member_id)
          )
      )
    )
  );

-- ==============================================================================
-- 9. VERIFICATION (uncomment and replace the placeholder to smoke-test)
-- ==============================================================================
-- insert into public.organization_units (workspace_id, name, code, unit_type)
-- values ('<your-workspace-id>', 'School of Information & Comm. Tech', 'SICT', 'faculty');
--
-- insert into public.organization_units (workspace_id, parent_id, name, code, unit_type)
-- select workspace_id, id, 'Computer Science', 'CS', 'department'
-- from public.organization_units where code = 'SICT';
--
-- insert into public.organization_units (workspace_id, parent_id, name, code, unit_type)
-- select workspace_id, id, 'IoT & Robotics Lab', 'IOT', 'lab'
-- from public.organization_units where code = 'CS';
--
-- select name, code, path from public.organization_units order by path;
-- Expected: SICT -> SICT | Computer Science -> SICT.CS | IoT & Robotics Lab -> SICT.CS.IOT
--
-- Subtree via RPC:  select * from public.get_unit_subtree_ids('<sict-unit-uuid>');
-- Authority check:  select public.can_manage_member('<manager-member-id>', '<target-member-id>');