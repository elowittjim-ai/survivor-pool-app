-- Survivor Pool: audit log for admin corrections.
-- Run this once in the Supabase SQL Editor, after 0001-0005.
--
-- Per PRD 5.8: the admin can fix a wrong pick or elimination at any point in
-- the season, and every correction needs a timestamped record of what
-- changed, who made it, and when. The app itself doesn't need a separate
-- "recalculate standings" step — the pick screen, grid, and results are all
-- computed live from picks + contestants, never cached, so editing the
-- underlying row is the whole fix. This table exists purely for the audit
-- trail admins can reference if a dispute comes up.

create table public.corrections (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  description text not null,
  created_at timestamptz not null default now()
);

alter table public.corrections enable row level security;

create policy "corrections_select_admin_only"
  on public.corrections for select
  using (public.is_admin());

create policy "corrections_insert_admin_only"
  on public.corrections for insert
  with check (public.is_admin() and admin_id = auth.uid());
