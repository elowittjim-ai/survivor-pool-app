-- Players still pay the full buy_in_amount via Venmo ($25), but $2 of that
-- is an admin fee that never enters the prize pool — the auto-calculated pot
-- should be based on the net amount per player ($23), not the full buy-in.
alter table public.season_state add column if not exists admin_fee_amount numeric not null default 2;
