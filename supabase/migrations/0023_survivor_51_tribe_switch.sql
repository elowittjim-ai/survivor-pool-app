-- Survivor 51, episode 4 (Oct 14, 2026) tribe switch — three tribes now.
-- Source: Wikipedia's Survivor 51 contestant table ("Switched" column).
-- Eliminated players (Aaliyah, Ana, Rob, Patt, Jenna) are left alone.

update contestants set tribe = 'Toka' where name in ('Brady', 'Kristin', 'Carter', 'Maggie', 'Thien An', 'Mike');
update contestants set tribe = 'Dina' where name in ('Linnea', 'Cristian', 'Sharonda', 'Lewis', 'Kilby', 'Eric');
update contestants set tribe = 'Savu' where name in ('Ori', 'Alexis', 'Jelly', 'Devin');

select name, tribe from contestants order by tribe, name;
