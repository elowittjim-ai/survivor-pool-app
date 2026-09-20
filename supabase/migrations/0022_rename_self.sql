-- Lets a player change their own display name after signup (it was
-- previously write-once — set at signup, no way to fix a typo or change it).
--
-- Deliberately NOT a plain RLS "update own row" policy: profiles also holds
-- is_admin/is_approved/chat_muted/venmo_handle/email, and Supabase's default
-- table grants would let a player write any column on their own row once
-- self-UPDATE is allowed at all. A security-definer function scoped to just
-- display_name avoids opening that up.
create or replace function public.rename_self(new_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  trimmed text := trim(new_name);
begin
  if trimmed = '' then
    raise exception 'Name cannot be empty';
  end if;
  if length(trimmed) > 40 then
    raise exception 'Name is too long';
  end if;

  update public.profiles set display_name = trimmed where id = auth.uid();
end;
$$;

grant execute on function public.rename_self(text) to authenticated;
