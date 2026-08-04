-- Survivor Pool: initial schema
-- Run this once in the Supabase SQL Editor.

-- One row per signed-up player. Created automatically on signup (see trigger below),
-- never inserted directly by the app.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  is_admin boolean not null default false,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- The Survivor cast for the season.
create table public.contestants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tribe text,
  status text not null default 'active' check (status in ('active', 'eliminated')),
  eliminated_week int,
  created_at timestamptz not null default now()
);

alter table public.contestants enable row level security;

-- Single-row table holding the season's current state.
create table public.season_state (
  id int primary key default 1,
  current_week int not null default 1,
  is_complete boolean not null default false,
  season_winner_contestant_id uuid references public.contestants(id),
  buy_in_amount numeric not null default 25,
  created_at timestamptz not null default now(),
  constraint season_state_single_row check (id = 1)
);

alter table public.season_state enable row level security;

insert into public.season_state (id) values (1);

-- Each player's pick for each week.
create table public.picks (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles(id) on delete cascade,
  week int not null check (week > 0),
  contestant_id uuid not null references public.contestants(id),
  created_at timestamptz not null default now(),
  unique (player_id, week)
);

alter table public.picks enable row level security;

-- ---------------------------------------------------------------------------
-- Helper functions (security definer: they can read tables the calling user's
-- own RLS policies would otherwise block, without those checks recursing).
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_approved()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_approved from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.current_season_week()
returns int
language sql
security definer
set search_path = public
stable
as $$
  select current_week from public.season_state where id = 1;
$$;

-- Creates a profile row automatically whenever someone signs up.
-- is_admin/is_approved default to false — the commissioner approves manually.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security policies
-- ---------------------------------------------------------------------------

-- profiles: you can see your own row; admins can see everyone. Only admins
-- can change approval/admin status (there's no self-serve way to approve
-- yourself).
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_admin_only"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- contestants: any approved player can read the cast list; only admins can
-- add contestants or mark them eliminated.
create policy "contestants_select_approved_or_admin"
  on public.contestants for select
  using (public.is_approved() or public.is_admin());

create policy "contestants_write_admin_only"
  on public.contestants for all
  using (public.is_admin())
  with check (public.is_admin());

-- season_state: any approved player can read it; only admins can advance
-- the week or declare a winner.
create policy "season_state_select_approved_or_admin"
  on public.season_state for select
  using (public.is_approved() or public.is_admin());

create policy "season_state_update_admin_only"
  on public.season_state for update
  using (public.is_admin())
  with check (public.is_admin());

-- picks: this is the deadline-gated visibility rule. A player can always see
-- their OWN pick (any week). They can see OTHER players' picks only for weeks
-- that are already closed (week < current_season_week()). Admins see
-- everything, including in-progress current-week picks, so they can run the
-- auto-pick for stragglers when closing a week.
create policy "picks_select_own_closed_weeks_or_admin"
  on public.picks for select
  using (
    player_id = auth.uid()
    or public.is_admin()
    or (public.is_approved() and week < public.current_season_week())
  );

-- Players can only submit/change a pick for the CURRENT week — past weeks are
-- locked once the admin closes them, since week will no longer equal
-- current_season_week(). Admins can insert/update on anyone's behalf (used
-- for the alphabetical auto-pick when someone misses the deadline).
create policy "picks_insert_own_current_week_or_admin"
  on public.picks for insert
  with check (
    public.is_admin()
    or (player_id = auth.uid() and public.is_approved() and week = public.current_season_week())
  );

create policy "picks_update_own_current_week_or_admin"
  on public.picks for update
  using (
    public.is_admin()
    or (player_id = auth.uid() and public.is_approved() and week = public.current_season_week())
  )
  with check (
    public.is_admin()
    or (player_id = auth.uid() and public.is_approved() and week = public.current_season_week())
  );
