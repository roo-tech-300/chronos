-- ==============================================================================
-- MIGRATION: 20260904_organization_unit_members.sql
-- Description: Creates the organization_unit_members junction table for
--              M:N staff appointments to organization units (primary, joint,
--              adjunct, secondment, affiliate).
-- ==============================================================================

create table if not exists public.organization_unit_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  unit_id uuid not null references public.organization_units(id) on delete cascade,
  member_id uuid not null references public.workspace_members(id) on delete cascade,

  is_primary boolean not null default false,
  assignment_type text not null default 'primary'
    check (assignment_type in ('primary', 'joint', 'adjunct', 'secondment', 'affiliate')),
  job_title text,
  reports_to uuid references public.workspace_members(id) on delete set null,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  constraint uq_org_unit_member unique (workspace_id, unit_id, member_id)
);

-- Indexes for lightning-fast lookups during roster queries and authority checks
create index if not exists idx_org_unit_members_workspace on public.organization_unit_members (workspace_id);
create index if not exists idx_org_unit_members_unit on public.organization_unit_members (unit_id);
create index if not exists idx_org_unit_members_member on public.organization_unit_members (member_id);
create index if not exists idx_org_unit_members_primary on public.organization_unit_members (member_id, is_primary) where is_primary = true;

-- Auto-update updated_at timestamp on row modification
create or replace function public.handle_org_unit_members_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists tr_org_unit_members_updated_at on public.organization_unit_members;
create trigger tr_org_unit_members_updated_at
  before update on public.organization_unit_members
  for each row
  execute function public.handle_org_unit_members_updated_at();

-- ==============================================================================
-- Row-Level Security (RLS) Policies
-- ==============================================================================
alter table public.organization_unit_members enable row level security;

-- Policy 1: Members of the workspace can view unit assignments
drop policy if exists "Members can view unit assignments" on public.organization_unit_members;
create policy "Members can view unit assignments"
  on public.organization_unit_members
  for select
  to authenticated
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = organization_unit_members.workspace_id
        and wm.user_id = auth.uid()
    )
  );

-- Policy 2: Workspace admins and owners can manage unit assignments
drop policy if exists "Workspace admins can manage unit assignments" on public.organization_unit_members;
create policy "Workspace admins can manage unit assignments"
  on public.organization_unit_members
  for all
  to authenticated
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = organization_unit_members.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = organization_unit_members.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );
