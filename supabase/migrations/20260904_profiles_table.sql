-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- Resolves member display names without a profiles table. The hierarchy lead
-- picker, task review grid, and roster views all depend on fetchMemberProfilesMap
-- (src/services/authIdentity.ts) querying public.profiles — which did not exist.
-- This migration creates the table, backfills existing auth users, and installs
-- a trigger so future signups auto-create a profile row.
-- ============================================================================

-- 1. CREATE TABLE
create table if not exists public.profiles (
  id uuid not null references auth.users(id) on delete cascade primary key,
  full_name text,
  email text,
  avatar_url text,
  department text,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 2. ROW LEVEL SECURITY
alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 3. AUTO-CREATE PROFILE ON SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    new.user_metadata->>'full_name',
    new.email,
    new.user_metadata->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. BACKFILL EXISTING USERS
insert into public.profiles (id, full_name, email, avatar_url)
select
  u.id,
  u.user_metadata->>'full_name',
  u.email,
  u.user_metadata->>'avatar_url'
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
)
on conflict (id) do nothing;
