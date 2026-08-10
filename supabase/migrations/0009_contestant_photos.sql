-- Contestant headshots, sourced from the legacy pool spreadsheet and served
-- as static files from /public/contestants/. Only a subset of the cast has a
-- photo available — contestants without a match keep the initials avatar.
alter table public.contestants add column if not exists photo_url text;

update public.contestants
set photo_url = '/contestants/' || lower(name) || '.jpg'
where lower(name) in (
  'angelina','aubry','charlie','chrissy','christian','cirie','coach','colby',
  'dee','emily','genevive','jenna','joe','jonathan','kamilla','kyle','mike','ozzy'
);
