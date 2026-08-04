-- Survivor Pool: reveal every pick once the season is officially over.
-- Run this once in the Supabase SQL Editor, after 0001_init.sql.
--
-- picks_select_own_closed_weeks_or_admin only reveals a pick once its week is
-- closed (week < current_season_week()). The admin can declare a winner
-- without one extra "close week" call for the finale, which would leave the
-- very last week's picks hidden from everyone but the admin on the Results
-- screen. Once season_state.is_complete is true there's no reason to keep
-- anything hidden, so add that as an additional visibility condition.

create or replace function public.season_is_complete()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_complete from public.season_state where id = 1), false);
$$;

drop policy if exists "picks_select_own_closed_weeks_or_admin" on public.picks;

create policy "picks_select_own_closed_weeks_or_admin"
  on public.picks for select
  using (
    player_id = auth.uid()
    or public.is_admin()
    or (public.is_approved() and week < public.current_season_week())
    or (public.is_approved() and public.season_is_complete())
  );
