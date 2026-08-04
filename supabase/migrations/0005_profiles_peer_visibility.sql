-- Survivor Pool: let approved players see each other's profiles.
-- Run this once in the Supabase SQL Editor, after 0001-0004.
--
-- The original policy only let a player see their OWN profile row (or an
-- admin see everyone). That quietly broke anything showing another player's
-- name to a non-admin: chat messages rendered as "Unknown" (the embedded
-- profiles(display_name) join was blocked by RLS), and the Season Grid would
-- have shown blank names for everyone but the viewer themselves. This is a
-- private pool among a known group, so any approved player seeing any other
-- approved player's profile (name, admin/mute status, email) is an
-- acceptable tradeoff for keeping this a single simple policy rather than a
-- column-restricted view.

drop policy if exists "profiles_select_own_or_admin" on public.profiles;

create policy "profiles_select_own_or_peer_or_admin"
  on public.profiles for select
  using (
    id = auth.uid()
    or public.is_admin()
    or (public.is_approved() and is_approved)
  );
