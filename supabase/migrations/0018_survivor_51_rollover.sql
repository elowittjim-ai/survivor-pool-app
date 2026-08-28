-- New season rollover: Survivor 51 cast (tribes not yet announced, so no
-- tribe set here — assign via Admin > Corrections once CBS reveals them).
-- Scope is deliberately narrow: only picks/contestants/season progress are
-- wiped. Player accounts, approvals, chat, and corrections history are left
-- alone — this is the same pool group continuing, not a fresh signup cycle.

delete from public.picks;

update public.season_state set season_winner_contestant_id = null;

delete from public.contestants;

update public.season_state
set current_week = 1,
    is_complete = false,
    picks_locked = false,
    season_winner_contestant_id = null,
    total_prize_pool = null
where id = 1;

insert into public.contestants (name) values
  ('Rob'),
  ('Brady'),
  ('Patt'),
  ('Linnea'),
  ('Cristian'),
  ('Sharonda'),
  ('Jenna'),
  ('Kristin'),
  ('Ori'),
  ('Lewis'),
  ('Kilby'),
  ('Carter'),
  ('Alexis'),
  ('Jelly'),
  ('Eric'),
  ('Maggie'),
  ('Thien An'),
  ('Mike'),
  ('Aaliyah'),
  ('Ana'),
  ('Devin');
