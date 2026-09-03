-- Lets the admin send out signup invites weeks before the season actually
-- premieres without the weekly pick flow (and its Sunday auto-lock cron,
-- see app/api/cron/lock-picks/route.js) kicking in early. Players can still
-- sign up and get approved while this is false — only picking is paused.
-- Defaults false so the currently-mid-gap season (rolled over in 0018, not
-- yet aired) starts out correctly gated; the admin flips it via a new
-- "Start the season" button once the premiere is about to air.
alter table public.season_state add column if not exists season_started boolean not null default false;
