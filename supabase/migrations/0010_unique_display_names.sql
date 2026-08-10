-- Prevents duplicate display names (case-insensitive) so the pool never ends
-- up with two indistinguishable "Jim"s in picks, chat, or the season grid.

-- Backstop against a race (two people submitting the same name at once) —
-- the signup action already checks this ahead of time via display_name_taken().
create unique index if not exists profiles_display_name_lower_idx
  on public.profiles (lower(display_name));

-- Lets an anonymous (not-yet-signed-up) visitor check name availability
-- without exposing the rest of the profiles table, which RLS would
-- otherwise block entirely for an unauthenticated request.
create or replace function public.display_name_taken(check_name text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(
    select 1 from public.profiles where lower(display_name) = lower(check_name)
  );
$$;

grant execute on function public.display_name_taken(text) to anon, authenticated;
