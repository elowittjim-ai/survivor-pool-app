-- Lets the admin record the Venmo username a player said they paid with,
-- so the roster can offer a tap-to-pay link at payout time instead of the
-- admin hunting through Venmo's search. Admin-entered, same as email
-- (0003) — this app has no player-facing settings screen, and profiles is
-- already admin-write-only (0001's profiles_update_admin_only).
alter table public.profiles add column if not exists venmo_handle text;
