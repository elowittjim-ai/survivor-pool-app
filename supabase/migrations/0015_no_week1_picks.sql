-- Week 1 is a no-picks week by house rule ("just to get a feel for the
-- season") — this has held across every season so far, so it's enforced
-- directly rather than via another admin toggle to remember to set.
drop policy if exists "picks_insert_own_current_week_or_admin" on public.picks;
create policy "picks_insert_own_current_week_or_admin"
  on public.picks for insert
  with check (
    public.is_admin()
    or (
      player_id = auth.uid()
      and public.is_approved()
      and week = public.current_season_week()
      and week > 1
      and not public.picks_locked()
    )
  );

drop policy if exists "picks_update_own_current_week_or_admin" on public.picks;
create policy "picks_update_own_current_week_or_admin"
  on public.picks for update
  using (
    public.is_admin()
    or (
      player_id = auth.uid()
      and public.is_approved()
      and week = public.current_season_week()
      and week > 1
      and not public.picks_locked()
    )
  )
  with check (
    public.is_admin()
    or (
      player_id = auth.uid()
      and public.is_approved()
      and week = public.current_season_week()
      and week > 1
      and not public.picks_locked()
    )
  );
