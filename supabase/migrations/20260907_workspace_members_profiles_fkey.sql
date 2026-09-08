-- ============================================================================
-- Migration: 20260907_workspace_members_profiles_fkey.sql
-- Purpose: PostgREST cannot embed profiles(...) inside workspace_members
--          because no FK path exists between the two tables (the logical
--          link runs through auth.users, which PostgREST cannot traverse).
--          Adding a direct FK user_id -> profiles.id makes the existing
--          task embeds (tasks -> workspace_members -> profiles) resolve.
-- ============================================================================

-- 0. Fail fast with a clear message if the profiles table is missing
do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'public.profiles does not exist - run 20260904_profiles_table.sql first';
  end if;
end $$;

-- 1. Backfill: ensure EVERY auth user has a profile row so the FK validates
insert into public.profiles (id, full_name, email, avatar_url)
select
  u.id,
  coalesce(
    u.raw_user_meta_data->>'display_name',
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(coalesce(u.email, ''), '@', 1)
  ),
  u.email,
  coalesce(
    u.raw_user_meta_data->>'avatar_url',
    u.raw_user_meta_data->>'picture'
  )
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
)
on conflict (id) do nothing;

-- 2. Add the missing relationship (idempotent)
do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'workspace_members'
      and constraint_name = 'workspace_members_user_id_profiles_fkey'
  ) then
    alter table public.workspace_members
      add constraint workspace_members_user_id_profiles_fkey
      foreign key (user_id) references public.profiles (id) on delete cascade;
  end if;
end $$;
