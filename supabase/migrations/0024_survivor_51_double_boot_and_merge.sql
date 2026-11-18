-- Survivor 51: two players went home in the same week (Kilby and Kristin), but
-- only one was checked off when the week was closed. Mark both out in the
-- most recent elimination week, then move everyone still in the game to the
-- merged tribe, Tovuto. Eliminated players are left on their old tribe.

update contestants
set status = 'eliminated',
    eliminated_week = (select max(eliminated_week) from contestants where status = 'eliminated')
where name in ('Kilby', 'Kristin');

update contestants set tribe = 'Tovuto' where status = 'active';

select name, tribe, status, eliminated_week from contestants order by status, eliminated_week, name;
