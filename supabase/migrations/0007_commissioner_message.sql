-- Optional announcement text shown on the new Home screen, editable by admins.
-- No new RLS policy needed — season_state is already readable by any approved
-- player and writable only by admins (see 0001_init.sql).
alter table public.season_state
  add column commissioner_message text;
