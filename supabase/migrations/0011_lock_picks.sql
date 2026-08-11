-- Splits "stop accepting picks" from "record who got eliminated" into two
-- separate admin actions, since in practice they happen on different days
-- (picks lock Monday morning, the episode airs and eliminates someone
-- Wednesday night).
alter table public.season_state add column if not exists picks_locked boolean not null default false;

create or replace function public.picks_locked()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select picks_locked from public.season_state where id = 1), false);
$$;

drop policy if exists "picks_insert_own_current_week_or_admin" on public.picks;
create policy "picks_insert_own_current_week_or_admin"
  on public.picks for insert
  with check (
    public.is_admin()
    or (
      player_id = auth.uid()
      and public.is_approved()
      and week = public.current_season_week()
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
      and not public.picks_locked()
    )
  )
  with check (
    public.is_admin()
    or (
      player_id = auth.uid()
      and public.is_approved()
      and week = public.current_season_week()
      and not public.picks_locked()
    )
  );
