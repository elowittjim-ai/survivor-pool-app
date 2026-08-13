-- Lets the admin set the actual total prize pool directly, instead of it
-- always being buy_in_amount * approved player count (real collected totals
-- rarely divide evenly). Null means "not set yet" — falls back to the
-- calculated amount.
alter table public.season_state add column if not exists total_prize_pool numeric;
