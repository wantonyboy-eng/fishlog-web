-- Run this in your EXISTING Supabase project's SQL Editor to fix the
-- "stuck on loading" bug. Safe to run even if some parts already exist.

-- 1. Add the onboarded flag if it's missing
alter table public.profiles add column if not exists onboarded boolean default false;

-- 2. Auto-create a profile row the instant someone signs up (fixes the
--    race condition where email confirmation delays profile creation)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    'angler_' || substr(replace(new.id::text, '-', ''), 1, 8),
    split_part(coalesce(new.email, 'angler'), '@', 1)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Backfill: create profile rows for any existing auth users who are
--    missing one (this is what fixes YOUR current stuck account)
insert into public.profiles (id, username, display_name)
select
  u.id,
  'angler_' || substr(replace(u.id::text, '-', ''), 1, 8),
  split_part(coalesce(u.email, 'angler'), '@', 1)
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
