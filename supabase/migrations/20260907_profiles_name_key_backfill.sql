-- ============================================================================
-- Migration: 20260907_profiles_name_key_backfill.sql
-- Purpose: Complements public.profiles so server-side ilike search matches the
--            EXACT names users see everywhere else (roster, task assignee, unit
--            member list, kiosk identity).
--
-- Problem: The base profiles migration copied ONLY user_metadata->>'full_name'.
--           Users whose auth metadata stores the name under 'display_name' or
--           'name' therefore got a NULL/empty full_name -> server-side search
--           returned nothing while every other view (which reads auth.users via
--           the resolve_kiosk_identity SECURITY DEFINER RPC) showed real names.

-- This migration backfills + future-proofs using the SAME COALESCE chain as the
-- resolve_kiosk_identity RPC (the authoritative identity source: auth.users).
-- ============================================================================

-- 1. Backfill full_name for existing profile rows with NULL / empty names
update public.profiles p
set full_name = coalesce(
    u.raw_user_meta_data->>'display_name',
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(COALESCE(u.email, ''), '@', 1)
  )
from auth.users u
where u.id = p.id
  and (p.full_name IS NULL OR btrim(p.full_name) = '');

-- 2. Backfill email when missing (keeps search-by-email complete)
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and (p.email IS NULL OR btrim(p.email) = '');

-- 3. Future-proof: signup trigger stores the same COALESCE chain going forward
--    (the existing on_auth_user_created trigger keeps its name; replacing the
--     function body automatically upgrades the trigger behavior)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(COALESCE(new.email, ''), '@', 1)
    ),
    new.email,
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        email    = excluded.email,
        avatar_url = excluded.avatar_url,
        updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Rebind the after-signup trigger (function was replaced above; trigger object persists
-- but re-created here for idempotent re-runs)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Optional sanity check (run manually in the SQL editor if desired):
--   select count(*) as still_null from public.profiles where full_name IS NULL OR btrim(full_name = '';
--   select id, full_name, email from public.profiles order by updated_at desc limit 10;
-- ============================================================================