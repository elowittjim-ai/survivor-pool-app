-- The Season Grid only revealed a week's picks once the admin fully closed
-- it (recorded eliminations, advanced current_week) — but picks already
-- lock earlier, either via the admin's "Lock picks" button or the
-- lock-picks cron job. Players expect to see everyone's pick for the
-- current week as soon as it's locked, not days later when eliminations
-- get recorded. Extend the same visibility rule used for closed weeks.
drop policy if exists "picks_select_own_closed_weeks_or_admin" on public.picks;

create policy "picks_select_own_closed_weeks_or_admin"
  on public.picks for select
  using (
    player_id = auth.uid()
    or public.is_admin()
    or (public.is_approved() and week < public.current_season_week())
    or (public.is_approved() and week = public.current_season_week() and public.picks_locked())
    or (public.is_approved() and public.season_is_complete())
  );
