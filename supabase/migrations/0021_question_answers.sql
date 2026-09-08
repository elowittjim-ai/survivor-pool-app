-- Lets the commissioner reply to a player's question with an actual answer
-- the player can see in the app, not just a "marked answered" checkbox.
-- Run this once in the Supabase SQL Editor.

alter table public.questions add column if not exists answer text;

-- Players could previously only insert their own question, never read it
-- (or any reply) back. Add read access to their own rows.
create policy "questions_select_own"
  on public.questions for select
  using (player_id = auth.uid());
