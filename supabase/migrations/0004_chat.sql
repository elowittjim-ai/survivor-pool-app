-- Survivor Pool: season group chat.
-- Run this once in the Supabase SQL Editor, after 0001, 0002, and 0003.

alter table public.profiles add column if not exists chat_muted boolean not null default false;

create or replace function public.is_muted()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select chat_muted from public.profiles where id = auth.uid()), false);
$$;

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  flagged boolean not null default false,
  deleted boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

-- Everyone approved sees the live conversation (both active and eliminated
-- players stay in it — matching the "spectator" spirit elsewhere in the app).
-- Deleted messages are soft-deleted for audit purposes, so only admins see
-- them (regular players just see the message disappear).
create policy "chat_select_approved_or_admin"
  on public.chat_messages for select
  using (
    public.is_admin()
    or (public.is_approved() and deleted = false)
  );

-- A muted player can't post; everyone else approved can, as themselves only.
create policy "chat_insert_own_if_approved_and_not_muted"
  on public.chat_messages for insert
  with check (
    author_id = auth.uid()
    and public.is_approved()
    and not public.is_muted()
  );

-- Moderation (soft-delete) is admin-only.
create policy "chat_update_admin_only"
  on public.chat_messages for update
  using (public.is_admin())
  with check (public.is_admin());
