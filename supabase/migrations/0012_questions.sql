-- Lets a player send a question straight to the commissioner from the app,
-- instead of needing to text/email separately.
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles(id) on delete cascade,
  question text not null,
  answered boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.questions enable row level security;

create policy "questions_insert_own"
  on public.questions for insert
  with check (player_id = auth.uid() and public.is_approved());

create policy "questions_admin_read_write"
  on public.questions for all
  using (public.is_admin())
  with check (public.is_admin());
