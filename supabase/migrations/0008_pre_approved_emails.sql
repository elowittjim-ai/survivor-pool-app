-- Lets the admin clear someone's access by email *before* they've signed up
-- (e.g. as soon as their Venmo payment comes in) — when they do sign up, the
-- signup trigger checks this table and approves them immediately instead of
-- leaving them on "waiting on approval."
create table public.pre_approved_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.pre_approved_emails enable row level security;

create policy "pre_approved_emails_admin_only"
  on public.pre_approved_emails for all
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pre_approved boolean;
begin
  select exists(
    select 1 from public.pre_approved_emails where email = lower(new.email)
  ) into pre_approved;

  insert into public.profiles (id, display_name, email, is_approved)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.email),
    new.email,
    coalesce(pre_approved, false)
  );

  if pre_approved then
    delete from public.pre_approved_emails where email = lower(new.email);
  end if;

  return new;
end;
$$;
