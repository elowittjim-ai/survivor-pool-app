-- Survivor Pool: store each player's email on their profile row.
-- Run this once in the Supabase SQL Editor, after 0001 and 0002.
--
-- auth.users isn't reachable through the app's normal Supabase client (it's a
-- protected schema, not exposed over the data API), so matching a player by
-- email — e.g. for bulk-approving a list of paid players — needs a copy of
-- the email living on the public.profiles row instead.

alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

-- Keep new signups' email in sync going forward.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email), new.email);
  return new;
end;
$$;
